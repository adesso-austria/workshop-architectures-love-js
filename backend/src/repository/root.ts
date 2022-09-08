import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";
import * as Db from "./db";
import * as Todo from "./todo";

export type Repository = {
  todo: Todo.Repository;
  applyEvents: (
    events: Domain.DomainEvent.DomainEvent[]
  ) => taskEither.TaskEither<string, void>;
};

export type ConnectOptions = { db?: Db.ConnectOptions };

export const connect = (options: ConnectOptions = {}) =>
  pipe(Db.connect(options.db), taskEither.map(create));

export const create = (): Repository => ({
  todo: Todo.create(),
  applyEvents: () => taskEither.left("not implemented"),
});
