import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore } from "utils";
import * as Domain from "../domain";
import * as Db from "./db";
import * as Todo from "./todo";

export type Repository = {
  flush: () => taskEither.TaskEither<string, void>;
  todo: Todo.Repository;
  getLastEventId: () => taskEither.TaskEither<string, option.Option<string>>;
  getLastKnownEventId: () => taskEither.TaskEither<
    string,
    option.Option<string>
  >;
  setLastKnownEventId: (id: string) => taskEither.TaskEither<string, void>;
  emit: (
    event: Domain.DomainEvent.DomainEvent
  ) => taskEither.TaskEither<string, void>;
  applyEvents: (
    events: Domain.DomainEvent.DomainEvent[]
  ) => taskEither.TaskEither<string, void>;
};

export type ConnectOptions = { db?: Db.ConnectOptions };

export const connect = (options: ConnectOptions = {}) =>
  pipe(Db.connect(options.db), taskEither.map(create));

export const create = (db: Db.Db): Repository => ({
  flush: () =>
    pipe(
      taskEither.Do,
      taskEither.apS("redis", db.redis.flush()),
      taskEither.apS("mongo", db.mongo.flush()),
      taskEither.map(ignore)
    ),
  todo: Todo.create(db),
  getLastEventId: db.redis.getLastEventId,
  getLastKnownEventId: db.mongo.getLastKnownEventId,
  setLastKnownEventId: db.mongo.setLastKnownEventId,
  emit: (event: Domain.DomainEvent.DomainEvent) =>
    db.redis.emit({ content: JSON.stringify(event.payload) }),
  applyEvents: () => taskEither.left("not implemented"),
});
