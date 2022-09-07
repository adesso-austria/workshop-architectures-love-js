import { option, taskEither } from "fp-ts";
import * as Mongo from "mongodb";
import * as Redis from "redis";
import * as Domain from "../domain";

export type Repository = {
  getTodos: () => taskEither.TaskEither<Error, Domain.Todo.Todo[]>;
  getTodo: (
    id: string
  ) => taskEither.TaskEither<Error, option.Option<Domain.Todo.Todo>>;
};

export const create = (): Repository => ({
  getTodos: () => taskEither.right([]),
  getTodo: () => taskEither.right(option.none),
});
