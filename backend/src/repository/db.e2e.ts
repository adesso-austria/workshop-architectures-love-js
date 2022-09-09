import { describe, it } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { mergeDeepRight } from "ramda";
import { ignore, throwException } from "utils";
import * as Db from "./db";

const withDb = (
  fn: (connect: taskEither.TaskEither<string, Db.Db>) => task.Task<void>,
  options: Db.ConnectOptions,
) =>
  pipe(
    Db.connect(mergeDeepRight(options, { redis: { db: 1 } })),
    taskEither.chain((db) =>
      pipe(
        db.flush(),
        taskEither.map(() => db),
      ),
    ),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain((db) =>
      pipe(
        db.flush(),
        taskEither.chain(() => db.disconnect()),
      ),
    ),
  );

describe("db", () => {
  describe("connect", () => {
    it(
      "should return left if given an invalid mongo url",
      withDb(
        taskEither.match(ignore, () => throwException("expected a left")),
        { mongo: { url: "fuytnrt" } },
      ),
    );
  });
});
