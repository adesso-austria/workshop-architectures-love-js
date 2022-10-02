import * as Crypto from "crypto";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import * as Domain from "../domain";
import { Repository } from "../repository";
import * as EventHandler from "./event-handler";

export type Application = {
  getTodo: (
    id: string,
  ) => taskEither.TaskEither<"db error" | "not found", Domain.Todo.Todo>;
  getTodos: () => taskEither.TaskEither<"db error", Domain.Todo.Todo[]>;
  addTodo: (
    addTodo: Domain.AddTodo.AddTodo,
  ) => taskEither.TaskEither<string, Domain.Todo.Todo>;
  deleteTodo: (id: string) => taskEither.TaskEither<string, void>;
  updateTodo: (
    todo: Domain.Todo.Todo,
  ) => taskEither.TaskEither<"not found" | "db error", void>;
};

/**
 * how should the todo domain react to events
 */
const createEventHandler = (repository: Repository) =>
  EventHandler.create(repository, "todoEventHandler", (event) =>
    match(event)
      .with({ type: "create todo" }, ({ payload }) =>
        repository.todo.addTodo(payload),
      )
      .with({ type: "delete todo" }, ({ payload }) =>
        repository.todo.deleteTodo(payload),
      )
      .with({ type: "update todo" }, ({ payload }) =>
        repository.todo.updateTodo(payload),
      )
      .otherwise(() => taskEither.right(undefined)),
  );

type CreateOpts = {
  repository: Repository;
  eventHandler: EventHandler.EventHandler;
};

/**
 * QUERY a single todo by id
 */
const createGetTodo =
  ({ repository }: CreateOpts): Application["getTodo"] =>
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

/**
 * QUERY all todos
 */
const createGetTodos =
  ({ repository }: CreateOpts): Application["getTodos"] =>
  () =>
    pipe(
      repository.todo.getTodos(),
      taskEither.mapLeft(() => "db error" as const),
    );

/**
 * COMMAND a todo to be added
 */
const createAddTodo =
  ({ eventHandler }: CreateOpts): Application["addTodo"] =>
  (addTodo) => {
    const todo: Domain.Todo.Todo = {
      ...addTodo,
      isDone: false,
      id: Crypto.randomUUID(),
      content: addTodo.content,
    };
    return pipe(
      eventHandler({
        type: "create todo",
        payload: todo,
      }),
      taskEither.map(() => todo),
    );
  };

/**
 * COMMAND a todo to be deleted
 */
const createDeleteTodo =
  ({ repository }: CreateOpts): Application["deleteTodo"] =>
  (id) =>
    taskEither.left("not implemented");
/**
 * COMMAND a todo to be updated
 */
const createUpdateTodo =
  ({ eventHandler }: CreateOpts): Application["updateTodo"] =>
  (todo) =>
    pipe(
      eventHandler({
        type: "update todo",
        payload: todo,
      }),
      taskEither.mapLeft((error) =>
        match(error)
          .with("could not find document to update", () => "not found" as const)
          .otherwise(() => "db error" as const),
      ),
    );

export const create = (repository: Repository): Application => {
  const eventHandler = createEventHandler(repository);

  const opts = { repository, eventHandler };

  return {
    getTodo: createGetTodo(opts),
    getTodos: createGetTodos(opts),
    addTodo: createAddTodo(opts),
    deleteTodo: createDeleteTodo(opts),
    updateTodo: createUpdateTodo(opts),
  };
};
