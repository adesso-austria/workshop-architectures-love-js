import { describe, it } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Db from "./db";

const withDb = (
  fn: (connect: taskEither.TaskEither<string, Db.Db>) => task.Task<void>,
  options: Db.ConnectOptions,
) =>
  pipe(
    Db.connect(options),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain((db) => db.disconnect()),
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
