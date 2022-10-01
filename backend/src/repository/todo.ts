import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";
import { Adapters } from "../adapter";

export type Repository = {
  addTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
  getTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  getTodo: (
    id: string,
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
  deleteTodo: (id: string) => taskEither.TaskEither<string, void>;
  updateTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
  getTodoCount: () => taskEither.TaskEither<string, number>;
};

export type CreateOpts = Adapters;

/**
 * @internal - only exported for unit testing
 */
export const collectionKey = "todos";

const addTodo =
  ({ mongo }: CreateOpts): Repository["addTodo"] =>
  (todo) =>
    mongo.addOne(collectionKey, todo);

const getTodo =
  ({ mongo }: CreateOpts): Repository["getTodo"] =>
  (id) =>
    mongo.findOne<Domain.Todo.Todo>(collectionKey, { id });

const getTodos =
  ({ mongo }: CreateOpts): Repository["getTodos"] =>
  () =>
    mongo.findAll<Domain.Todo.Todo>(collectionKey, {});

const createDeleteTodo =
  ({ mongo }: CreateOpts): Repository["deleteTodo"] =>
  (id) =>
    mongo.deleteOne(collectionKey, { id });

const createUpdateTodo =
  ({ mongo }: CreateOpts): Repository["updateTodo"] =>
  (todo) =>
    mongo.updateOne(collectionKey, { id: todo.id }, todo);

const createGetTodoCount =
  ({ mongo }: CreateOpts): Repository["getTodoCount"] =>
  () =>
    pipe(
      mongo.findAll(collectionKey, {}),
      taskEither.map((results) => results.length),
    );

export const create = (opts: CreateOpts): Repository => {
  return {
    addTodo: addTodo(opts),
    getTodos: getTodos(opts),
    getTodo: getTodo(opts),
    deleteTodo: createDeleteTodo(opts),
    updateTodo: createUpdateTodo(opts),
    getTodoCount: createGetTodoCount(opts),
  };
};
