import { fastify } from "fastify";
import { array, either, task } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import * as Domain from "../domain";
import { Env } from "./env";
import * as Todo from "./todo";

const setupFastify = (env: Env) => {
  const app = fastify();

  app.get("/_heartbeat", () => "online");

  app.register(Todo.createRoutes(env));

  return app;
};

const setupEventHandlers = (env: Env) => {
  /**
   * small utility to aggregate eithers into an array of their lefts, ignoring their rights
   */
  const aggregageErrors = (
    results: Array<either.Either<string, void>>,
  ): string[] =>
    results.reduce(
      (errors, result) =>
        pipe(
          result,
          either.match(
            (error) => {
              errors.push(error);
              return errors;
            },
            () => errors,
          ),
        ),
      [] as string[],
    );

  const todoEventHandler = Todo.createEventHandler(env);

  /**
   * aggregate Array<Task<Either<string, void>>> into Task<Array<Either<string, void>>>.
   * I.e.: execute an array of tasks in parallel to get an array of results.
   */
  const aggregatedEventHandler = (event: Domain.Event.Event) =>
    pipe([todoEventHandler(event)], array.sequence(task.ApplicativePar));

  env.repositories.event.events$
    .pipe(
      Rx.concatMap((event) => {
        const handleEvent = pipe(
          aggregatedEventHandler(event),
          task.map(aggregageErrors),
        );
        return Rx.from(handleEvent());
      }),
    )

    .subscribe((errors) => {
      console.log(...errors);
    });
};

export const create = (env: Env) => {
  setupEventHandlers(env);
  return setupFastify(env);
};
