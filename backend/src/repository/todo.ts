import { option, taskEither } from "fp-ts";
import * as Domain from "../domain";

export type Repository = {
  getTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  getTodo: (
    id: string
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
};

export const create = (): Repository => ({
  getTodos: () => taskEither.right([]),
  getTodo: () => taskEither.right(option.none),
});
