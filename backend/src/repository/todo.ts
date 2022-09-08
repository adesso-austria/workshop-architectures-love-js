import { option, taskEither } from "fp-ts";
import * as Domain from "../domain";
import * as Db from "./db";
import type * as Root from "./root";

export type Repository = {
  addTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
  getTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  getTodo: (
    id: string
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
};

export const create = (
  db: Db.Db,
  getRepo: () => Root.Repository
): Repository => ({
  addTodo: () => taskEither.left("not implemented"),
  getTodos: () => taskEither.left("not implemented"),
  getTodo: () => taskEither.left("not implemented"),
});
