import { describe, it, expect } from "@jest/globals";
import { either, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestUtils from "../test-utils";

describe("mongo", () => {
  it(
    "should return left if no url is given",
    pipe(
      TestUtils.Mongo.connect(""),
      taskEither.match(ignore, () => throwException("expected a left"))
    )
  );

  it(
    "should return left ECREATE when given an invalid url",
    pipe(
      TestUtils.Mongo.connect("foo"),
      taskEither.match(ignore, () => throwException("expected a left"))
    )
  );

  it(
    "should return right when connection to db succeeds",
    pipe(
      TestUtils.Mongo.connect(),
      taskEither.match(() => throwException("expected a right"), ignore)
    )
  );

  describe("getLastKnownEventId", () => {
    it(
      "should return left ENOTFOUND if the db is empty",
      pipe(
        TestUtils.Mongo.connect(),
        taskEither.chain(({ getLastKnownEventId }) => getLastKnownEventId()),
        taskEither.match(ignore, () => throwException("expected a left"))
      )
    );

    it("should return right if key was found", async () => {
      const task = pipe(
        TestUtils.Mongo.connect(),
        taskEither.chain((client) =>
          pipe(
            client.setLastKnownEventId("bla"),
            taskEither.chain(() => client.getLastKnownEventId())
          )
        )
      );
      expect(await task()).toEqual(either.right("bla"));
    });
  });

  describe("setLastKnownEventId", () => {
    it(
      "should return right",
      pipe(
        TestUtils.Mongo.connect(),
        taskEither.chain((client) =>
          pipe(
            client.setLastKnownEventId("foo"),
            taskEither.chain(() => client.getLastKnownEventId())
          )
        ),
        taskEither.match(
          () => throwException("expected a right"),
          (id) => expect(id).toEqual("foo")
        )
      )
    );
  });
});
