import { describe, it } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestData from "../test-data";
import { getTodo } from "./todo";

describe("todo", () => {
  describe("getTodo", () => {
    it(
      "should return left if the repository throws an error",
      pipe(
        getTodo(
          TestData.Env.create({
            repositories: {
              todo: {
                getTodo: () => taskEither.left("something's up"),
              },
            },
          }),
          "foo",
        ),
        taskEither.match(ignore, () => throwException("expected a left")),
      ),
    );

    it(
      "should return left if the repository can't find the todo",
      pipe(
        getTodo(
          TestData.Env.create({
            repositories: {
              todo: {
                getTodo: () => taskEither.right(option.none),
              },
            },
          }),
          "foo",
        ),
        taskEither.match(ignore, () => throwException("expected a left")),
      ),
    );

    it(
      "should return a right if the repository can find the todo",
      pipe(
        getTodo(
          TestData.Env.create({
            repositories: {
              todo: {
                getTodo: () =>
                  taskEither.right(option.some(TestData.Todo.buyIcecream)),
              },
            },
          }),
          "foo",
        ),
        taskEither.match(() => throwException("expected a right"), ignore),
      ),
    );
  });
});
