import { describe, it, expect } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { throwException } from "utils";
import * as TestData from "../test-data";
import * as TestUtils from "../test-utils";

describe("todo", () => {
  describe("getTodo", () => {
    it(
      "should return right none for an unknown todo",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) => repo.todo.getTodo("foo")),
        taskEither.match(
          () => throwException("expected a right"),
          (todo) => expect(todo).toEqual(option.none)
        )
      )
    );

    it(
      "should find a todo that has been added",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) =>
          pipe(
            repo.todo.addTodo(TestData.Todo.buyIcecream),
            taskEither.chain(() =>
              repo.todo.getTodo(TestData.Todo.buyIcecream.id)
            )
          )
        ),
        taskEither.match(
          () => throwException("expected a right"),
          (todo) => expect(todo).toEqual(option.some(TestData.Todo.buyIcecream))
        )
      )
    );
  });

  describe("getTodos", () => {
    it(
      "should fetch all todos",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.chain((repo) =>
          pipe(
            repo.todo.addTodo(TestData.Todo.buyIcecream),
            taskEither.chain(() => repo.todo.getTodos())
          )
        ),
        taskEither.match(
          (error) => throwException(error),
          (todos) => expect(todos).toEqual([TestData.Todo.buyIcecream])
        )
      )
    );
  });
});
