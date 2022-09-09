import { describe, it, expect, jest } from "@jest/globals";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestData from "../test-data";
import * as TestUtils from "../test-utils";

describe("event", () => {
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

    it(
      "should not apply the same event twice",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) => {
          const spy = jest.fn(() => taskEither.right(undefined));
          repo.todo.applyEvent = spy;
          return pipe(
            repo.event.emit(TestData.DomainEvent.createBuyIcecream),
            taskEither.chain(() => repo.event.syncState()),
            taskEither.chain(() => repo.event.syncState()),
            taskEither.map(() => spy)
          );
        }),
        taskEither.match(throwException, (spy) =>
          expect(spy).toHaveBeenCalledTimes(1)
        )
      )
    );
  });
});
