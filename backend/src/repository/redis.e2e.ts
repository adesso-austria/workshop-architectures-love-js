import { describe, it, expect } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestData from "../test-data";
import * as TestUtils from "../test-utils";

describe("redis", () => {
  it(
    "should return left if invalid connection url is given",
    pipe(
      TestUtils.Repository.connect({ db: { redis: { url: "fuytnwrt" } } }),
      taskEither.match(ignore, () => throwException("expected a left"))
    )
  );

  it(
    "should return a right if a valid url is given",
    pipe(
      TestUtils.Repository.connect(),
      taskEither.match(() => throwException("expected a right"), ignore)
    )
  );

  describe("getLastEventId", () => {
    it(
      "should return the last event id",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((client) =>
          pipe(
            client.emit({
              type: "create todo",
              payload: TestData.AddTodo.buyIcecream,
            }),
            taskEither.chain(() => client.getLastEventId())
          )
        ),
        taskEither.match(throwException, (id) => expect(id).toBeDefined())
      )
    );

    it(
      "should return option.none if no events exist",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((client) => client.getLastEventId()),
        taskEither.match(
          () => throwException("expected a right"),
          (id) => expect(id).toEqual(option.none)
        )
      )
    );
  });
});
