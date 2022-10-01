import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match, P } from "ts-pattern";
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
  fetchTodoCount: () => taskEither.TaskEither<string, number>;
};

export const create = (fetcher: Fetcher): Api => ({
  addTodo: (addTodo) =>
    pipe(
      fetcher.postTodo({ body: addTodo }),
      taskEither.map(
        (res): Domain.Todo.Todo => ({
          id: res.data,
          title: addTodo.title,
          content: option.none,
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
      taskEither.chain((res) =>
        match(res)
          .with({ status: 200 }, ({ data }) => taskEither.right(data))
          .with({ status: P.union(400, 404, 500) }, ({ data }) =>
            taskEither.left(data),
          )
          .exhaustive(),
      ),
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
        match(res)
          .with({ status: 204 }, () => taskEither.right(undefined))
          .with({ status: 400 }, () => taskEither.left("validation error"))
          .with({ status: 404 }, () =>
            taskEither.left("can't update non-existent todo"),
          )
          .with({ status: 500 }, () => taskEither.left("server error"))
          .exhaustive(),
      ),
    ),
  fetchTodoCount: () =>
    pipe(
      fetcher.getTodoCount(undefined),
      taskEither.chain((res) =>
        match(res)
          .with({ status: 200 }, ({ data }) => taskEither.right(parseInt(data)))
          .otherwise((res) =>
            taskEither.left(`unhandled status code ${res.status}`),
          ),
      ),
    ),
});
