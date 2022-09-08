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
        TestUtils.Mongo.connect(),
        taskEither.chain((client) => client.getTodo("foo")),
        taskEither.match(
          () => throwException("expected a right"),
          (todo) => expect(todo).toEqual(option.none)
        )
      )
    );

    it(
      "should find a todo that has been added",
      pipe(
        TestUtils.Mongo.connect(),
        taskEither.chain((client) =>
          pipe(
            client.addTodo(TestData.Todo.buyIcecream),
            taskEither.chain(() => client.getTodo(TestData.Todo.buyIcecream.id))
          )
        ),
        taskEither.match(
          () => throwException("expected a right"),
          (todo) => expect(todo).toEqual(option.some(TestData.Todo.buyIcecream))
        )
      )
    );
  });

  // describe("getTodos", () => {
  //   it(
  //     "should fetch all todos",
  //     pipe(
  //       TestUtils.Db.connect(),
  //       taskEither.map(create),
  //       taskEither.chain((repo) => repo.getTodos()),
  //       taskEither.match(
  //         () => throwException("expected a right"),
  //         (todos) => expect(todos).toEqual(TestData.Todo.all)
  //       )
  //     )
  //   );
  // });
});
