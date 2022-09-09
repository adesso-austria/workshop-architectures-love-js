import { describe, it } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { DeepPartial, ignore, throwException } from "utils";
import * as TestUtils from "../test-utils";
import * as Db from "./db";

const withDb = (
  fn: (connect: taskEither.TaskEither<string, Db.Db>) => task.Task<void>,
  options: DeepPartial<Db.ConnectOptions> = {},
) =>
  pipe(
    Db.connect(TestUtils.Repository.createConnectOptions({ db: options }).db),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain((db) => db.disconnect()),
  );

describe("db", () => {
  describe("connect", () => {
    it(
      "should return left if given an invalid mongo url",
      withDb(
        taskEither.match(ignore, () => throwException("expected a left")),
        { mongo: { url: "utyfnrst" } },
      ),
    );

    it(
      "should return left if given an invalid redis url",
      withDb(
        taskEither.match(ignore, () => throwException("expected a left")),
        { redis: { url: "tunyfwnrst" } },
      ),
    );

    it(
      "should return left if given invalid urls for redis and mongo",
      withDb(
        taskEither.match(ignore, () => throwException("expected a left")),
        { redis: { url: "fuynt" }, mongo: { url: "nfytr" } },
      ),
    );

    it(
      "should return right if given valid urls",
      withDb(taskEither.match(throwException, ignore)),
    );
  });

  describe("disconnect", () => {
    it(
      "should return right for valid connections",
      withDb(
        flow(
          taskEither.chain((db) => db.disconnect()),
          taskEither.match(throwException, ignore),
        ),
      ),
    );
  });
});
