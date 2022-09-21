import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import * as Domain from "../domain";
import { Repository } from "../repository";
import * as Consumer from "./consumer";

export type Application = {
  consumer: Consumer.Consumer;
  getTodo(
    id: string,
  ): taskEither.TaskEither<"db error" | "not found", Domain.Todo.Todo>;
  getTodos(): taskEither.TaskEither<"db error", Domain.Todo.Todo[]>;
  addTodo(
    addTodo: Domain.AddTodo.AddTodo,
  ): taskEither.TaskEither<string, Domain.Todo.Todo>;
};

//////////////////////////////////////////////////////
// WRITE MODEL
//////////////////////////////////////////////////////

const createConsumer = (repository: Repository) =>
  Consumer.create(repository, "todo", (event) =>
    pipe(
      match(event)
        .with({ type: "create todo" }, ({ payload }) =>
          repository.todo.addTodo(payload),
        )
        .otherwise(() => taskEither.right(undefined)),
    ),
  );

//////////////////////////////////////////////////////
// READ MODEL
//////////////////////////////////////////////////////

const createGetTodo =
  (repository: Repository): Application["getTodo"] =>
  (id: string) =>
    pipe(
      repository.todo.getTodo(id),
      taskEither.mapLeft(() => "db error" as const),
      taskEither.chain(
        option.match(
          (): ReturnType<Application["getTodo"]> =>
            taskEither.left("not found"),
          taskEither.of,
        ),
      ),
    );

const createGetTodos =
  (repository: Repository): Application["getTodos"] =>
  () =>
    pipe(
      repository.todo.getTodos(),
      taskEither.mapLeft(() => "db error" as const),
    );

const createAddTodo =
  (repository: Repository): Application["addTodo"] =>
  (todo) =>
    taskEither.left("not implemented");

export const create = (repository: Repository): Application => {
  return {
    consumer: createConsumer(repository),
    getTodo: createGetTodo(repository),
    getTodos: createGetTodos(repository),
    addTodo: createAddTodo(repository),
  };
};
