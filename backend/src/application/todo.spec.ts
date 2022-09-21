import { describe, it } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { DeepPartial, ignore, throwException } from "utils";
import { Repository } from "../repository";
import * as TestData from "../test-data";
import * as Todo from "./todo";

const create = (repository: DeepPartial<Repository>): Todo.Application =>
  Todo.create(TestData.Repository.create(repository));

describe("todo", () => {
  describe("getTodo", () => {
    it(
      "should return left if the repository throws an error",
      pipe(
        create({
          todo: {
            getTodo: () => taskEither.left("something's up"),
          },
        }),
        (app) => app.getTodo("foo"),
        taskEither.match(ignore, () => throwException("expected a left")),
      ),
    );

    it(
      "should return left if the repository can't find the todo",
      pipe(
        create({
          todo: {
            getTodo: () => taskEither.right(option.none),
          },
        }),
        (app) => app.getTodo("foo"),
        taskEither.match(ignore, () => throwException("expected a left")),
      ),
    );

    it(
      "should return a right if the repository can find the todo",
      pipe(
        create({
          todo: {
            getTodo: () =>
              taskEither.right(option.some(TestData.Todo.buyIcecream)),
          },
        }),
        (app) => app.getTodo("foo"),
        taskEither.match(() => throwException("expected a right"), ignore),
      ),
    );
  });

  describe("addTodo", () => {
    it.todo("should be idempotent");
  });
});
