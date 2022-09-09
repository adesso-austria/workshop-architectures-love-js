import { option, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { ignore } from "utils";
import * as Domain from "../domain";
import * as Db from "./db";
import { stripMongoId } from "./mongo";
import type * as Root from "./root";

export type Repository = {
  addTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
  getTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  getTodo: (
    id: string
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
  applyEvent: (
    event: Domain.DomainEvent.DomainEvent
  ) => taskEither.TaskEither<string, void>;
};

const addTodo = (db: Db.Db, todo: Domain.Todo.Todo) =>
  taskEither.tryCatch(
    () =>
      db.mongo.todos
        .insertOne(todo, { forceServerObjectId: true })
        .then(ignore),
    (reason) => reason as string
  );

export const create = (
  db: Db.Db,
  getRepo: () => Root.Repository
): Repository => ({
  applyEvent: (event) =>
    match(event)
      .with({ type: "create todo" }, ({ payload }) => addTodo(db, payload))
      .exhaustive(),
  addTodo: (todo) => addTodo(db, todo),
  getTodos: () => taskEither.left("not implemented"),
  getTodo: (id) =>
    pipe(
      getRepo().event.syncState(),
      taskEither.chain(() =>
        taskEither.tryCatch(
          () =>
            db.mongo.todos.findOne({ id }).then(
              flow(
                option.fromNullable,
                option.map((doc) => stripMongoId(doc))
              )
            ),
          (reason) => reason as string
        )
      )
    ),
});
