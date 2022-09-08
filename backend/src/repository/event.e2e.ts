import { describe, it, expect } from "@jest/globals";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestData from "../test-data";
import * as TestUtils from "../test-utils";

describe("event", () => {
  describe("getUnknownEvents", () => {
    it(
      "should return an empty array if no events have been added",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) => repo.event.getUnknownEvents()),
        taskEither.match(throwException, (events) =>
          expect(events).toHaveLength(0)
        )
      )
    );
  });

  describe("emit", () => {
    it(
      "should work",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) =>
          repo.event.emit(TestData.DomainEvent.createBuyIcecream)
        ),
        taskEither.match(throwException, ignore)
      )
    );
  });
});
