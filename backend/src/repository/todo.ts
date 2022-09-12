import { option, taskEither } from "fp-ts";
import { ignore } from "utils";
import { flow } from "fp-ts/lib/function";
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
  mongo: Mongo.Client;
};

const addTodo =
  ({ mongo }: CreateOpts): Repository["addTodo"] =>
  (todo) =>
    taskEither.tryCatch(
      () =>
        mongo.todos.insertOne(todo, { forceServerObjectId: true }).then(ignore),
      (reason) => reason as string,
    );

const getTodo =
  ({ mongo }: CreateOpts): Repository["getTodo"] =>
  (id) =>
    taskEither.tryCatch(
      () =>
        mongo.todos
          .findOne({ id })
          .then(flow(option.fromNullable, option.map(Mongo.stripId))),
      (reason) => reason as string,
    );

export const create = (opts: CreateOpts): Repository => {
  return {
    addTodo: addTodo(opts),
    getTodos: () => taskEither.left("not implemented"),
    getTodo: getTodo(opts),
  };
};
