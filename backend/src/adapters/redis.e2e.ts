import * as Crypto from "crypto";
import { describe, it, expect } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Redis from "./redis";

const withClient = (
  fn: (
    connectResult: taskEither.TaskEither<string, Redis.Client>,
  ) => task.Task<void>,
  url = "redis://localhost:6379",
) =>
  pipe(
    Redis.connect({ url, namespace: Crypto.randomUUID() }),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain(Redis.disconnect),
  );

describe("redis", () => {
  describe("connect", () => {
    it(
      "should return left if invalid connection url is given",
      withClient(
        taskEither.match(ignore, () => throwException("expected a left")),
        "uyfntw",
      ),
    );

    it(
      "should return a right if a valid url is given",
      withClient(taskEither.match(throwException, ignore)),
    );
  });
});
