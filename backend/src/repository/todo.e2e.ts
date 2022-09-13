import * as Crypto from "crypto";
import { describe, expect, it } from "@jest/globals";
import { flow, pipe } from "fp-ts/lib/function";
import { option, task, taskEither } from "fp-ts";
import { throwException } from "utils";
import { Mongo } from "../adapters";
import * as TestData from "../test-data";
import * as Todo from "./todo";

const withRepo = (
  fn: (
    repoTask: taskEither.TaskEither<
      string,
      { repo: Todo.Repository; mongo: Mongo.Client }
    >,
  ) => task.Task<void>,
  url = "mongodb://localhost:27017",
) =>
  pipe(
    Mongo.connect({
      url,
      namespace: Crypto.randomUUID(),
    }),
    task.chainFirst(
      flow(
        taskEither.fromEither,
        taskEither.map((mongo) => ({ repo: Todo.create({ mongo }), mongo })),
        fn,
      ),
    ),
    taskEither.chain((mongo) => mongo.disconnect()),
  );

describe("todo", () => {
  describe("getTodo", () => {
    it(
      "should return right none if the todo could not be found",
      withRepo(
        flow(
          taskEither.chain(({ repo }) => repo.getTodo("foo")),
          taskEither.match(throwException, (result) =>
            expect(result).toEqual(option.none),
          ),
        ),
      ),
    );

    it(
      "should return some todo that has been added before",
      withRepo(
        flow(
          taskEither.chainFirst(({ repo }) =>
            repo.addTodo(TestData.Todo.buyIcecream),
          ),
          taskEither.chain(({ repo }) =>
            repo.getTodo(TestData.Todo.buyIcecream.id),
          ),
          taskEither.match(throwException, (result) =>
            expect(result).toEqual(option.some(TestData.Todo.buyIcecream)),
          ),
        ),
      ),
    );
  });

  describe("logEventId", () => {
    withRepo(
      flow(
        taskEither.chainFirst(({ repo }) =>
          repo.logEvent(TestData.Event.createBuyIcecream),
        ),
        taskEither.chain(({ mongo }) =>
          taskEither.tryCatch(
            () =>
              mongo.todos.events.findOne({
                id: TestData.Event.createBuyIcecream.id,
              }),
            (reason) => reason as string,
          ),
        ),
        taskEither.match(throwException, (event) =>
          expect(event).toEqual(TestData.Event.createBuyIcecream),
        ),
      ),
    );
  });
});
