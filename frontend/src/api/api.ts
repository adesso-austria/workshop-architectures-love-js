import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";
import { Fetcher } from "./fetcher";
import * as Todo from "./todo";

export type Api = {
  addTodo: (
    addTodo: Domain.AddTodo.AddTodo,
  ) => taskEither.TaskEither<string, Domain.Todo.Todo>;
  fetchTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
};

export const create = (fetcher: Fetcher): Api => ({
  addTodo: (addTodo) =>
    pipe(
      fetcher.postTodo({ body: addTodo }),
      taskEither.map(
        (res): Domain.Todo.Todo => ({
          id: option.some(res.data),
          title: addTodo.title,
          content: option.none,
        }),
      ),
    ),
  fetchTodos: () =>
    pipe(
      fetcher.getTodos(undefined),
      taskEither.map((response) => response.data.map(Todo.toDomain)),
    ),
});
