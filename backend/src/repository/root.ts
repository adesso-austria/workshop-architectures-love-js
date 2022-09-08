import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore } from "utils";
import * as Db from "./db";
import * as Todo from "./todo";
import * as Event from "./event";

export type Repository = {
  flush: () => taskEither.TaskEither<string, void>;
  todo: Todo.Repository;
  event: Event.Repository;
};

export type ConnectOptions = { db?: Db.ConnectOptions };

export const connect = (options: ConnectOptions = {}) =>
  pipe(Db.connect(options.db), taskEither.map(create));

export const create = (db: Db.Db): Repository => {
  const repository: Repository = {
    flush: () =>
      pipe(
        taskEither.Do,
        taskEither.apS("mongo", db.mongo.flush()),
        taskEither.apS("redis", db.redis.flush()),
        taskEither.map(ignore)
      ),
    todo: Todo.create(db, () => repository),
    event: Event.create(db),
  };
  return repository;
};
