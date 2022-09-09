import * as Crypto from "crypto";
import { it } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { mergeDeepRight } from "ramda";
import { DeepPartial, ignore, throwException } from "utils";
import * as Repository from "../repository";

const connect = (options: Repository.ConnectOptions) =>
  pipe(Repository.connect(options));

export const createConnectOptions = (
  overrides: DeepPartial<Repository.ConnectOptions> = {},
): Repository.ConnectOptions =>
  mergeDeepRight(
    {
      db: {
        redis: {
          url: "redis://localhost:6379",
          namespace: Crypto.randomUUID(),
        },
        mongo: {
          url: "mongodb://localhost:27017",
          namespace: Crypto.randomUUID(),
        },
      },
    },
    overrides,
  );

export const withRepo = (
  description: string,
  fn: (repo: Repository.Repository) => task.Task<void>,
  options: DeepPartial<{ connect: Repository.ConnectOptions }> = {},
) =>
  it(
    description,
    pipe(
      connect(createConnectOptions(options.connect ?? {})),
      taskEither.chain((repo) =>
        pipe(
          taskEither.tryCatch(
            () => fn(repo)(),
            (error) => error,
          ),
          task.chainFirst(() => repo.disconnect()),
        ),
      ),
      taskEither.match(throwException, ignore),
    ),
  );
