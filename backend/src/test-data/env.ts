import * as Crypto from "crypto";
import { task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { mergeDeepRight } from "ramda";
import { DeepPartial, ignore } from "utils";
import { Env } from "../application";
import { Event, Todo } from "./repository";

export const defaultEnv: Env.Env = {
  repositories: { event: Event.repository, todo: Todo.repository },
};

export const create = (overrides: DeepPartial<Env.Env>): Env.Env =>
  mergeDeepRight(defaultEnv, overrides);

/**
 * @deprecated - TODO: replace with mocked adapters
 */
export const withAdapters = (
  fn: (adapters: ReturnType<typeof Env["createAdapters"]>) => task.Task<void>,
) =>
  pipe(
    Env.createAdapters({
      mongoUrl: "mongodb://localhost:27017",
      mongoNamespace: Crypto.randomUUID(),
      redisUrl: "redis://localhost:6379",
      redisNamespace: Crypto.randomUUID(),
    }),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain(({ mongo, redis }) =>
      pipe(
        taskEither.Do,
        taskEither.apS("mongo", mongo.close()),
        taskEither.apS("redis", redis.close()),
      ),
    ),
    task.map(ignore),
  );
