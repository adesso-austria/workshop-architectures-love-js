import * as Crypto from "crypto";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import * as Domain from "../domain";
import { Repository } from "../repository";
import * as EventHandler from "./event-handler";

export type Application = {
  getTodo(
    id: string,
  ): taskEither.TaskEither<"db error" | "not found", Domain.Todo.Todo>;
  getTodos(): taskEither.TaskEither<"db error", Domain.Todo.Todo[]>;
  addTodo(
    addTodo: Domain.AddTodo.AddTodo,
  ): taskEither.TaskEither<string, Domain.Todo.Todo>;
  deleteTodo(id: string): taskEither.TaskEither<string, void>;
};

//////////////////////////////////////////////////////
// WRITE MODEL
//////////////////////////////////////////////////////

const createEventHandler = (repository: Repository) =>
  EventHandler.create(repository, "todoEventHandler", (event) =>
    match(event)
      .with({ type: "create todo" }, ({ payload }) =>
        repository.todo.addTodo(payload),
      )
      .with({ type: "delete todo" }, ({ payload }) =>
        repository.todo.deleteTodo(payload),
      )
      .otherwise(() => taskEither.right(undefined)),
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
  (eventHandler: EventHandler.EventHandler): Application["addTodo"] =>
  (addTodo) => {
    const todo: Domain.Todo.Todo = {
      ...addTodo,
      isDone: false,
      id: Crypto.randomUUID(),
    };
    return pipe(
      eventHandler({
        type: "create todo",
        payload: todo,
      }),
      taskEither.map(() => todo),
    );
  };

const createDeleteTodo =
  (eventHandler: EventHandler.EventHandler): Application["deleteTodo"] =>
  (id) =>
    eventHandler({
      type: "delete todo",
      payload: id,
    });

export const create = (repository: Repository): Application => {
  const eventHandler = createEventHandler(repository);

  return {
    getTodo: createGetTodo(repository),
    getTodos: createGetTodos(repository),
    addTodo: createAddTodo(eventHandler),
    deleteTodo: createDeleteTodo(eventHandler),
  };
};
