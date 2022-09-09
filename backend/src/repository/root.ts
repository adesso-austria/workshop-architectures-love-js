import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Db from "./db";
import * as Todo from "./todo";
import * as Event from "./event";

export type Repository = {
  disconnect: () => taskEither.TaskEither<string, void>;
  todo: Todo.Repository;
  event: Event.Repository;
};

export type ConnectOptions = { db: Db.ConnectOptions };

export const connect = (options: ConnectOptions) =>
  pipe(Db.connect(options.db), taskEither.map(create));

export const create = (db: Db.Db): Repository => {
  const getRepo = () => repository;
  const repository: Repository = {
    disconnect: () => db.disconnect(),
    todo: Todo.create(db, getRepo),
    event: Event.create(db, getRepo),
  };
  return repository;
};
