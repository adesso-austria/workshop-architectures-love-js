import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore } from "utils";
import * as Domain from "../domain";
import * as Db from "./db";

export type Repository = {
  addTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
  getTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  getTodo: (
    id: string
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
};

const applyEvents =
  (_db: Db.Db) =>
  (
    _events: Domain.DomainEvent.DomainEvent[]
  ): taskEither.TaskEither<string, void> =>
    taskEither.right(undefined);

const getTodo =
  (db: Db.Db): Repository["getTodo"] =>
  (id) =>
    taskEither.tryCatch(
      () => db.mongo.todos.findOne({ id }).then(option.fromNullable),
      (reason) => `error when searching for todo: ${reason}`
    );

const getTodos =
  (db: Db.Db): Repository["getTodos"] =>
  () =>
    pipe(
      db.getUnknownEvents(),
      taskEither.chain(applyEvents(db)),
      taskEither.chain(() =>
        taskEither.tryCatch(
          () => db.mongo.todos.find().toArray(),
          (reason) => `could not fetch all todos: ${reason}`
        )
      )
    );

const addTodo =
  (db: Db.Db): Repository["addTodo"] =>
  (todo) =>
    taskEither.tryCatch(
      () => db.mongo.todos.insertOne(todo).then(ignore),
      (reason) => `error when adding todo: ${reason}`
    );

export const create = (db: Db.Db): Repository => ({
  addTodo: addTodo(db),
  getTodos: getTodos(db),
  getTodo: getTodo(db),
});
