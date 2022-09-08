import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";
import * as Db from "./db";

export type Repository = {
  emit: (
    event: Domain.DomainEvent.DomainEvent
  ) => taskEither.TaskEither<string, void>;
  getUnknownEvents: () => taskEither.TaskEither<
    string,
    Domain.DomainEvent.DomainEvent[]
  >;
};

export const create = (db: Db.Db): Repository => ({
  emit: (event) => db.redis.addEvent(event.payload),
  getUnknownEvents: () =>
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
          if (Domain.DomainEvent.isDomainEvent(message)) {
            events.push(message);
          }
          return events;
        }, [] as Domain.DomainEvent.DomainEvent[])
      )
    ),
});
