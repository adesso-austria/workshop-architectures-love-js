import { describe, it, expect } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException, Jest } from "utils";
import { LightMyRequestResponse } from "fastify";
import * as Boundary from "../boundary";
import * as TestData from "../test-data";
import { Repository } from "../repository";
import { getTodo } from "./todo";
import * as Root from "./root";
import * as Env from "./env";

describe("todo", () => {
  describe("getTodo", () => {
    it(
      "should return left if the repository throws an error",
      pipe(
        getTodo(
          TestData.Repository.create({
            todo: {
              getTodo: () => taskEither.left("something's up"),
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
          TestData.Repository.create({
            todo: {
              getTodo: () => taskEither.right(option.none),
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
          TestData.Repository.create({
            todo: {
              getTodo: () =>
                taskEither.right(option.some(TestData.Todo.buyIcecream)),
            },
          }),
          "foo",
        ),
        taskEither.match(() => throwException("expected a right"), ignore),
      ),
    );
  });

  describe("routes", () => {
    Jest.testGivenThen<
      ReturnType<Repository["todo"]["getTodo"]>,
      (response: LightMyRequestResponse) => void
    >(
      "/todo",
      async (givenTodoReturn, checkExpectation) => {
        const root = Root.create(
          Env.create(
            TestData.Repository.create({
              todo: {
                getTodo: () => givenTodoReturn,
              },
            }),
          ),
        );
        const response = await root.inject({
          path: "/todo",
          query: {
            id: "foo",
          },
        });
        checkExpectation(response);
      },
      [
        Jest.givenThen(
          "should return status 500 if the repository threw an error",
          taskEither.left("something's up"),
          (response) => {
            expect(response.statusCode).toEqual(500);
          },
        ),
        Jest.givenThen(
          "should return status 404 if the todo can't be found",
          taskEither.right(option.none),
          (response) => {
            expect(response.statusCode).toEqual(404);
          },
        ),
        Jest.givenThen(
          "should return the todo with status 200 if it could be found",
          taskEither.right(option.some(TestData.Todo.buyIcecream)),
          (response) => {
            expect(response.statusCode).toEqual(200);
            expect(response.json()).toEqual(
              Boundary.Todo.fromDomain(TestData.Todo.buyIcecream),
            );
          },
        ),
      ],
    );
  });
});
