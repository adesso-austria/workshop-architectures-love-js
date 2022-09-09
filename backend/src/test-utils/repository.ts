import { it } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Repository from "../repository";

const connect = (options: Repository.ConnectOptions = {}) =>
  pipe(Repository.connect(options));

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
          task.chainFirst(() => repo.disconnect()),
        ),
      ),
      taskEither.match(throwException, ignore),
    ),
  );
