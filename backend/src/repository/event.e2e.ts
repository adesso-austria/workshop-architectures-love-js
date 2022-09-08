import { describe, it, expect, jest } from "@jest/globals";
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

    it(
      "should return an array of events that have not been applied",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) =>
          pipe(
            repo.event.emit(TestData.DomainEvent.createBuyIcecream),
            taskEither.chain(() => repo.event.getUnknownEvents())
          )
        ),
        taskEither.match(throwException, (events) =>
          expect(events).toEqual([TestData.DomainEvent.createBuyIcecream])
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

  describe("syncState", () => {
    it(
      "should apply missing events",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) => {
          const spy = jest.fn(() => taskEither.right(undefined));
          repo.todo.applyEvent = spy;
          return pipe(
            repo.event.emit(TestData.DomainEvent.createBuyIcecream),
            taskEither.chain(() => repo.event.syncState()),
            taskEither.map(() => spy)
          );
        }),
        taskEither.match(throwException, (spy) =>
          expect(spy).toHaveBeenCalledWith(
            TestData.DomainEvent.createBuyIcecream
          )
        )
      )
    );
  });
});
