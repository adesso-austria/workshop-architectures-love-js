import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore } from "utils";
import * as Domain from "../domain";
import * as Db from "./db";
import type * as Root from "./root";

export type Repository = {
  emit: (
    event: Domain.DomainEvent.DomainEvent
  ) => taskEither.TaskEither<string, string>;
  syncState: () => taskEither.TaskEither<string, void>;
};

const serializeEvent = (event: Domain.DomainEvent.DomainEvent) => ({
  type: event.type,
  payload: JSON.stringify(event.payload),
});

const deserializeEvent = (
  message: Record<string, string | Buffer>
): Domain.DomainEvent.DomainEvent => {
  const parsed = JSON.parse(message["payload"]?.toString() ?? "");
  return {
    type: message["type"],
    payload: parsed,
  } as Domain.DomainEvent.DomainEvent;
};

const getUnknownEvents = (
  db: Db.Db
): taskEither.TaskEither<
  string,
  Array<{ id: string; event: Domain.DomainEvent.DomainEvent }>
> =>
  pipe(
    taskEither.tryCatch(
      () =>
        db.mongo.kv
          .findOne({ key: "lastKnownEventId" })
          .then((doc) => option.fromNullable(doc?.value)),
      (reason) => reason as string
    ),
    taskEither.chain((lastKnown) => db.redis.getEvents(lastKnown)),
    taskEither.map((messages) =>
      messages.reduce((events, { id, message }) => {
        events.push({ id, event: deserializeEvent(message) });
        return events;
      }, [] as Array<{ id: string; event: Domain.DomainEvent.DomainEvent }>)
    )
  );

const applyEvent = (
  repo: Root.Repository,
  event: Domain.DomainEvent.DomainEvent
): taskEither.TaskEither<string, void> => pipe(repo.todo.applyEvent(event));

export const create = (
  db: Db.Db,
  getRepo: () => Root.Repository
): Repository => ({
  emit: (event) => db.redis.addEvent(serializeEvent(event)),
  syncState: () => {
    const repo = getRepo();
    return pipe(
      getUnknownEvents(db),
      taskEither.chain((events) =>
        events.reduce((task, { id, event }) => {
          return pipe(
            task,
            taskEither.chain(() => applyEvent(repo, event)),
            taskEither.chain(() =>
              taskEither.tryCatch(
                () =>
                  db.mongo.kv
                    .updateOne(
                      { key: "lastKnownEventId" },
                      { $set: { value: id } },
                      { upsert: true }
                    )
                    .then(ignore),
                (reason) => reason as string
              )
            )
          );
        }, taskEither.right<string, void>(undefined))
      )
    );
  },
});
