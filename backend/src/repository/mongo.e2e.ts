import { describe, it, expect } from "@jest/globals";
import { either, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestUtils from "../test-utils";

describe("mongo", () => {
  it(
    "should return left if no url is given",
    pipe(
      TestUtils.Repository.connect({ db: { mongo: { url: "" } } }),
      taskEither.match(ignore, () => throwException("expected a left"))
    )
  );

  it(
    "should return left when given an invalid url",
    pipe(
      TestUtils.Repository.connect({ db: { mongo: { url: "foo" } } }),
      taskEither.match(ignore, () => throwException("expected a left"))
    )
  );

  it(
    "should return right when connection to db succeeds",
    pipe(
      TestUtils.Repository.connect(),
      taskEither.match(() => throwException("expected a right"), ignore)
    )
  );

  describe("getLastKnownEventId", () => {
    it(
      "should return option.none if the db is empty",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) => repo.getLastKnownEventId()),
        taskEither.match(
          () => throwException("expected a left"),
          (id) => expect(id).toEqual(option.none)
        )
      )
    );

    it("should return right if key was found", async () => {
      const task = pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((client) =>
          pipe(
            client.setLastKnownEventId("bla"),
            taskEither.chain(() => client.getLastKnownEventId())
          )
        )
      );
      expect(await task()).toEqual(either.right(option.some("bla")));
    });
  });

  describe("setLastKnownEventId", () => {
    it(
      "should return right",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) =>
          pipe(
            repo.setLastKnownEventId("foo"),
            taskEither.chain(() => repo.getLastKnownEventId())
          )
        ),
        taskEither.match(
          () => throwException("expected a right"),
          (id) => expect(id).toEqual(option.some("foo"))
        )
      )
    );
  });
});
