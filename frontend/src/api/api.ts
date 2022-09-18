import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";
import { Fetcher } from "./fetcher";
import * as Todo from "./todo";

export type Api = {
  fetchTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
};

export const create = (fetcher: Fetcher): Api => ({
  fetchTodos: () =>
    pipe(
      fetcher.getTodos(undefined),
      taskEither.map((response) => response.data.map(Todo.toDomain)),
    ),
});
