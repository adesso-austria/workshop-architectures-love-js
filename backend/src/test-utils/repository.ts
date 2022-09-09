import * as Crypto from "crypto";
import { it } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { mergeDeepRight } from "ramda";
import { ignore, throwException } from "utils";
import * as Repository from "../repository";

const connect = (options: Repository.ConnectOptions = {}) =>
  pipe(
    Repository.connect(
      mergeDeepRight(options, {
        db: { mongo: { db: Crypto.randomUUID() }, redis: { db: 1 } },
      }),
    ),
    taskEither.chain((repository) =>
      pipe(
        repository.flush(),
        taskEither.map(() => repository),
      ),
    ),
  );

export const withRepo = (
  description: string,
  fn: (repo: Repository.Repository) => task.Task<void>,
  options: { connect: Repository.ConnectOptions } = { connect: {} },
) =>
  it(
    description,
    pipe(
      connect(options.connect),
      taskEither.chain((repo) =>
        pipe(
          taskEither.tryCatch(
            () => fn(repo)(),
            (error) => error,
          ),
          task.chainFirst(() => repo.flush()),
          task.chainFirst(() => repo.disconnect()),
        ),
      ),
      taskEither.match(throwException, ignore),
    ),
  );
