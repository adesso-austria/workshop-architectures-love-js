import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { TypeGuards } from "utils";
import * as Domain from "../domain";
import * as Db from "./db";
import type * as Root from "./root";

export type Repository = {
  emit: (
    event: Domain.DomainEvent.DomainEvent
  ) => taskEither.TaskEither<string, void>;
  getUnknownEvents: () => taskEither.TaskEither<
    string,
    Domain.DomainEvent.DomainEvent[]
  >;
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

const getUnknownEvents = (db: Db.Db) =>
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
      messages.reduce((events, { message }) => {
        events.push(deserializeEvent(message));
        return events;
      }, [] as Domain.DomainEvent.DomainEvent[])
    )
  );

export const create = (
  db: Db.Db,
  getRepo: () => Root.Repository
): Repository => ({
  emit: (event) => db.redis.addEvent(serializeEvent(event)),
  getUnknownEvents: () => getUnknownEvents(db),
  syncState: () => {
    const repo = getRepo();
    return pipe(
      getUnknownEvents(db),
      taskEither.chain((events) =>
        events.reduce((task, event) => {
          return pipe(
            task,
            taskEither.chain(() => repo.todo.applyEvent(event))
          );
        }, taskEither.right<string, void>(undefined))
      )
    );
  },
});
