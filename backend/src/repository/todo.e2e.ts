import * as Crypto from "crypto";
import { describe, expect, it } from "@jest/globals";
import { pipe } from "fp-ts/lib/function";
import { option, taskEither } from "fp-ts";
import { throwException } from "utils";
import * as Adapters from "../adapters";
import * as TestData from "../test-data";
import * as Todo from "./todo";

const connect = pipe(
  Adapters.Mongo.connect({
    url: "mongodb://localhost:27017",
    namespace: Crypto.randomUUID(),
  }),
  taskEither.map((mongo) => Todo.create({ mongo })),
);

describe("todo", () => {
  describe("getTodo", () => {
    it(
      "should return right none if the todo could not be found",
      pipe(
        connect,
        taskEither.chain((repo) => repo.getTodo("foo")),
        taskEither.match(throwException, (result) =>
          expect(result).toEqual(option.none),
        ),
      ),
    );

    it(
      "should return some todo that has been added before",
      pipe(
        connect,
        taskEither.chainFirst((repo) =>
          repo.addTodo(TestData.Todo.buyIcecream),
        ),
        taskEither.chain((repo) => repo.getTodo(TestData.Todo.buyIcecream.id)),
        taskEither.match(throwException, (result) =>
          expect(result).toEqual(option.some(TestData.Todo.buyIcecream)),
        ),
      ),
    );
  });
});
