import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { ignore } from "utils";
import * as Domain from "../domain";
import { Fetcher } from "./fetcher";
import * as Todo from "./todo";

export type Api = {
  addTodo: (
    addTodo: Domain.AddTodo.AddTodo,
  ) => taskEither.TaskEither<string, Domain.Todo.Todo>;
  fetchTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  deleteTodo: (id: string) => taskEither.TaskEither<string, void>;
  fetchContent: (id: string) => taskEither.TaskEither<string, string>;
  updateTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
};

export const create = (fetcher: Fetcher): Api => ({
  addTodo: (addTodo) =>
    pipe(
      fetcher.postTodo({ body: addTodo }),
      taskEither.map(
        (res): Domain.Todo.Todo => ({
          id: res.data,
          title: addTodo.title,
          content: option.some(addTodo.content),
          isDone: false,
        }),
      ),
    ),
  fetchTodos: () =>
    pipe(
      fetcher.getTodos(undefined),
      taskEither.map((response) => response.data.map(Todo.toDomain)),
    ),
  deleteTodo: (id) =>
    pipe(fetcher.deleteTodo({ query: { id } }), taskEither.map(ignore)),
  fetchContent: (id) =>
    pipe(
      fetcher.getTodoContent({ query: { id } }),
      taskEither.map((res) => res.data),
    ),
  updateTodo: (todo) =>
    pipe(
      fetcher.putTodo({
        body: {
          id: todo.id,
          title: todo.title,
          content: pipe(
            todo.content,
            option.getOrElse(() => ""),
          ),
          isDone: todo.isDone,
        },
      }),
      taskEither.chain((res) =>
        match(res.status)
          .with(204, () => taskEither.right(undefined))
          .with(400, () => taskEither.left("validation error"))
          .with(404, () => taskEither.left("can't update non-existent todo"))
          .with(500, () => taskEither.left("server error"))
          .exhaustive(),
      ),
    ),
});
