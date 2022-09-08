import { option, taskEither } from "fp-ts";
import * as Domain from "../domain";
import type { Env } from "./root";

export type Repository = {
  getTodos: () => taskEither.TaskEither<Error, Domain.Todo.Todo[]>;
  getTodo: (
    id: string
  ) => taskEither.TaskEither<Error, option.Option<Domain.Todo.Todo>>;
};

export const create = (env: Env): Repository => ({
  getTodos: () => taskEither.right([]),
  getTodo: () => taskEither.right(option.none),
});
