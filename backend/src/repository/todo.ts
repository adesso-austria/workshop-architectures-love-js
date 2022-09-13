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
  /**
   * logs an event id that has led to the current state
   */
  logEvent: (event: Domain.Event.Event) => taskEither.TaskEither<string, void>;
  hasEventBeenLogged: (
    event: Domain.Event.Event,
  ) => taskEither.TaskEither<string, boolean>;
};

export type CreateOpts = {
  mongo: Mongo.Client;
};

const taskify = <T>(
  createPromise: () => Promise<T>,
): taskEither.TaskEither<string, T> =>
  taskEither.tryCatch(createPromise, (reason) => reason as string);

const addTodo =
  ({ mongo }: CreateOpts): Repository["addTodo"] =>
  (todo) =>
    taskify(() =>
      mongo.todos.collection
        .insertOne(todo, { forceServerObjectId: true })
        .then(ignore),
    );

const getTodo =
  ({ mongo }: CreateOpts): Repository["getTodo"] =>
  (id) =>
    taskify(() =>
      mongo.todos.collection
        .findOne({ id })
        .then(flow(option.fromNullable, option.map(Mongo.stripId))),
    );

const logEventId =
  ({ mongo: { todos } }: CreateOpts): Repository["logEvent"] =>
  (event) =>
    taskify(() =>
      todos.events.insertOne(event, { forceServerObjectId: true }).then(ignore),
    );

const hasEventBeenLogged =
  ({ mongo: { todos } }: CreateOpts): Repository["hasEventBeenLogged"] =>
  (event) =>
    taskify(() => todos.events.findOne(event).then((found) => found != null));

export const create = (opts: CreateOpts): Repository => {
  return {
    addTodo: addTodo(opts),
    getTodos: () => taskEither.left("not implemented"),
    getTodo: getTodo(opts),
    logEvent: logEventId(opts),
    hasEventBeenLogged: hasEventBeenLogged(opts),
  };
};
