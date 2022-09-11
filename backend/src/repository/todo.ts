import { option, taskEither } from "fp-ts";
import { flow } from "fp-ts/lib/function";
import { ignore } from "utils";
import * as Domain from "../domain";
import { Mongo } from "../adapters";

export type Repository = {
  addTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
  getTodos: () => taskEither.TaskEither<string, Domain.Todo.Todo[]>;
  getTodo: (
    id: string,
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
};

const addTodo = (mongo: Mongo.Client, todo: Domain.Todo.Todo) =>
  taskEither.tryCatch(
    () =>
      mongo.todos.insertOne(todo, { forceServerObjectId: true }).then(ignore),
    (reason) => reason as string,
  );

export const create = ({ mongo }: { mongo: Mongo.Client }): Repository => ({
  addTodo: (todo) => addTodo(mongo, todo),
  getTodos: () => taskEither.left("not implemented"),
  getTodo: (id) =>
    taskEither.tryCatch(
      () =>
        mongo.todos.findOne({ id }).then(
          flow(
            option.fromNullable,
            option.map((doc) => Mongo.stripMongoId(doc)),
          ),
        ),
      (reason) => reason as string,
    ),
});
