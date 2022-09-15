import { option, taskEither } from "fp-ts";
import * as Domain from "../domain";
import { Mongo } from "../adapters";

export type Repository = {
  addTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
  getTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  getTodo: (
    id: string,
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
};

export type CreateOpts = {
  mongo: Mongo.Adapter;
};

const collectionKey = "todos";

const createAddTodo =
  ({ mongo }: CreateOpts): Repository["addTodo"] =>
  (todo) =>
    mongo.addOne(collectionKey, todo);

const createGetTodo =
  ({ mongo }: CreateOpts): Repository["getTodo"] =>
  (id) =>
    mongo.findOne<Domain.Todo.Todo>(collectionKey, { id });

export const create = (opts: CreateOpts): Repository => {
  return {
    addTodo: createAddTodo(opts),
    getTodos: () => taskEither.left("not implemented"),
    getTodo: createGetTodo(opts),
  };
};
