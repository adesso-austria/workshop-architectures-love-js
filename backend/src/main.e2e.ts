import * as Crypto from "crypto";
import { describe, it, expect } from "@jest/globals";
import { ignore, Jest, throwException } from "utils";
import { either, io, option, task, taskEither } from "fp-ts";
import { mergeDeepRight, omit } from "ramda";
import { flow, pipe } from "fp-ts/lib/function";
import * as Adapters from "./adapters";
import * as Main from "./main";

const withMockedEnv = (env: Record<string, string>, fn: io.IO<void>) => {
  const originalEnv = process.env;
  process.env = mergeDeepRight(process.env, env);
  fn();
  process.env = originalEnv;
};

Jest.testGivenWhenThen<Record<string, string>, string, option.Option<string>>(
  "readEnv",
  async (givenEnv, whenRequested, expectResult) => {
    withMockedEnv(givenEnv, () => {
      expect(Main.readEnv(whenRequested)()).toEqual(expectResult);
    });
  },
  [
    Jest.givenWhenThen(
      "should return none if key doesn't exist",
      {},
      "foo",
      option.none,
    ),
    Jest.givenWhenThen(
      "should return some value if key exists",
      { foo: "bar" },
      "foo",
      option.some("bar"),
    ),
  ],
);

Jest.testGivenWhenThen<
  Record<string, string>,
  string,
  either.Either<string, string>
>(
  "requireEnv",
  async (givenEnv, whenRequested, expectedResult) => {
    withMockedEnv(givenEnv, () => {
      expect(Main.requireEnv(whenRequested)()).toEqual(expectedResult);
    });
  },
  [
    Jest.givenWhenThen(
      "should return left if key doesn't exist",
      {},
      "foo",
      either.left("foo is required in env"),
    ),
    Jest.givenWhenThen(
      "should return right if key exists",
      { foo: "bar" },
      "foo",
      either.right("bar"),
    ),
  ],
);

const defaultProcessEnvironment = {
  MONGO_URL: "mongodb://localhost:27017",
  MONGO_NAMESPACE: Crypto.randomUUID(),
  REDIS_URL: "redis://localhost:6379",
  REDIS_NAMESPACE: Crypto.randomUUID(),
};
Jest.testGivenThen<
  Record<string, string>,
  (result: either.Either<string, Record<string, string>>) => void
>(
  "readProcessEnvironment",
  async (givenEnv, assertExpectation) => {
    withMockedEnv(givenEnv, () => {
      pipe(Main.readProcessEnvironment(), assertExpectation);
    });
  },
  [
    Jest.givenThen(
      "should return left error if mongo url is missing",
      omit(["MONGO_URL"], defaultProcessEnvironment),
      either.match(ignore, () => throwException("expected a left")),
    ),
    Jest.givenThen(
      "should return left error if redis url is missing",
      omit(["REDIS_URL"], defaultProcessEnvironment),
      either.match(ignore, () => throwException("expected a left")),
    ),
    Jest.givenThen(
      "should return left error if mongo url is empty",
      { ...defaultProcessEnvironment, MONGO_URL: "" },
      either.match(ignore, () => throwException("expected a left")),
    ),
    Jest.givenThen(
      "should return left error if redis url is empty",
      { ...defaultProcessEnvironment, REDIS_URL: "" },
      either.match(ignore, () => throwException("expected a left")),
    ),
    Jest.givenThen(
      "should return right if mongo namespace is missing",
      omit(["MONGO_NAMESPACE"], defaultProcessEnvironment),
      either.match(throwException, ignore),
    ),
    Jest.givenThen(
      "should return right if redis namespace is missing",
      omit(["REDIS_NAMESPACE"], defaultProcessEnvironment),
      either.match(throwException, ignore),
    ),
  ],
);

Jest.testGivenThen<
  Parameters<typeof Main["createAdapters"]>[0],
  (taskEither: ReturnType<typeof Main["createAdapters"]>) => task.Task<void>
>(
  "createAdapters",
  (givenParams, assertExpectation) =>
    pipe(
      Main.createAdapters(givenParams),
      task.chainFirst(flow(taskEither.fromEither, assertExpectation)),
      taskEither.chain(({ redis, mongo }) =>
        pipe(
          taskEither.Do,
          taskEither.apS("mongo", mongo.disconnect()),
          taskEither.apS("redis", Adapters.Redis.disconnect(redis)),
        ),
      ),
      task.map(ignore),
    )(),
  [
    Jest.givenThen(
      "should return left if passed an invalid mongo url",
      {
        mongoUrl: "yfwnt",
        mongoNamespace: "",
        redisUrl: "redis://localhost:6379",
        redisNamespace: "",
      },
      taskEither.match(ignore, () => throwException("expected a left")),
    ),
  ],
);
