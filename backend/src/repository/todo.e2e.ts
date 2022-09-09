import { describe, expect } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { throwException } from "utils";
import * as TestData from "../test-data";
import * as TestUtils from "../test-utils";

describe("todo", () => {
  describe("getTodo", () => {
    TestUtils.Repository.withRepo(
      "should return right none if the todo could not be found",
      (repo) =>
        pipe(
          repo.todo.getTodo("foo"),
          taskEither.match(throwException, (maybeTodo) =>
            expect(maybeTodo).toEqual(option.none),
          ),
        ),
    );

    TestUtils.Repository.withRepo(
      "should return some todo that has been added before",
      (repo) =>
        pipe(
          repo.todo.addTodo(TestData.Todo.buyIcecream),
          taskEither.chain(() =>
            repo.todo.getTodo(TestData.Todo.buyIcecream.id),
          ),
          taskEither.match(throwException, (todo) =>
            expect(todo).toEqual(option.some(TestData.Todo.buyIcecream)),
          ),
        ),
    );

    TestUtils.Repository.withRepo(
      "should sync the state before returning the todo",
      (repo) =>
        pipe(
          repo.event.emit(TestData.DomainEvent.createBuyIcecream),
          taskEither.chain(() =>
            repo.todo.getTodo(TestData.DomainEvent.createBuyIcecream.payload.id),
          ),
          taskEither.match(throwException, (todo) =>
            expect(todo).toEqual(
              option.some(TestData.DomainEvent.createBuyIcecream.payload),
            ),
          ),
        ),
    );
  });

  describe("applyEvent", () => {
    TestUtils.Repository.withRepo(
      "should add a todo for a createEvent",
      (repo) =>
        pipe(
          repo.todo.applyEvent(TestData.DomainEvent.createBuyIcecream),
          taskEither.chain(() =>
            repo.todo.getTodo(TestData.DomainEvent.createBuyIcecream.payload.id),
          ),
          taskEither.match(throwException, (todo) =>
            expect(todo).toEqual(
              option.some(TestData.DomainEvent.createBuyIcecream.payload),
            ),
          ),
        ),
    );
  });
});
