import { option, taskEither } from "fp-ts";
import * as Domain from "../domain";
import { Adapters } from "../adapters";

export type Repository = {
  addTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
  getTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  getTodo: (
    id: string,
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
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

export const create = (opts: CreateOpts): Repository => {
  return {
    addTodo: addTodo(opts),
    getTodos: getTodos(opts),
    getTodo: getTodo(opts),
  };
};
