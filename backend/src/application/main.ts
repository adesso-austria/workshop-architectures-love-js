import { array, either, task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import * as Env from "./env";
import * as Todo from "./todo";

export const create = (env: Env.Env) => {
  const todoConsumer = Todo.createConsumer(env);

  /**
   * aggregate Array<Task<Either<string, void>>> into Task<Array<Either<string, void>>>.
   * I.e.: execute an array of tasks in parallel to get an array of results.
   */
  const consumer = pipe(
    taskEither.Do,
    taskEither.apS("todoConsumer", todoConsumer),
    taskEither.map(({ todoConsumer }) => Rx.merge(todoConsumer)),
  );

  return {
    start: consumer,
  };
};
