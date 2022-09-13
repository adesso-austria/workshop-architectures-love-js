import { describe, it, expect } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException, Jest } from "utils";
import { InjectOptions, LightMyRequestResponse } from "fastify";
import * as Boundary from "../boundary";
import * as Domain from "../domain";
import * as TestData from "../test-data";
import * as Repository from "../repository";
import { getTodo } from "./todo";
import * as Root from "./root";
import { Env } from "./env";

describe("todo", () => {
  describe("getTodo", () => {
    it(
      "should return left if the repository throws an error",
      pipe(
        getTodo(
          TestData.Repository.Todo.create({
            getTodo: () => taskEither.left("something's up"),
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
          TestData.Repository.Todo.create({
            getTodo: () => taskEither.right(option.none),
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
          TestData.Repository.Todo.create({
            getTodo: () =>
              taskEither.right(option.some(TestData.Todo.buyIcecream)),
          }),
          "foo",
        ),
        taskEither.match(() => throwException("expected a right"), ignore),
      ),
    );
  });

  describe("routes", () => {
    Jest.testGivenThen<
      ReturnType<Repository.Todo.Repository["getTodo"]>,
      (response: LightMyRequestResponse) => void
    >(
      "/todo",
      async (givenTodoReturn, checkExpectation) => {
        const root = Root.create(
          TestData.Env.create({
            repositories: {
              todo: {
                getTodo: () => givenTodoReturn,
              },
            },
          }),
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

    Jest.testGivenWhenThen<
      Partial<Domain.AddTodo.AddTodo>,
      Env,
      (response: LightMyRequestResponse) => void
    >(
      "POST /todo",
      async (givenPayload, whenEnv, expectResponse) => {
        const root = Root.create(whenEnv);

        const response = await root.inject({
          path: "/todo",
          method: "POST",
          ...(givenPayload == null ? {} : { payload: givenPayload }),
        });
        expectResponse(response);
      },
      [
        Jest.givenWhenThen(
          "should reject with 400 if no title is present in the body",
          {
            content: "test",
          },
          TestData.Env.create({}),
          (response) => {
            expect(response.statusCode).toEqual(400);
          },
        ),
        Jest.givenWhenThen(
          "should reject with 400 if the title is empty",
          { content: "valid", title: "" },
          TestData.Env.create({}),
          (response) => {
            expect(response.statusCode).toEqual(400);
          },
        ),
        Jest.givenWhenThen(
          "should reject with 400 if no content is present in the body",
          {
            title: "test",
          },
          TestData.Env.create({}),
          (response) => {
            expect(response.statusCode).toEqual(400);
          },
        ),
        Jest.givenWhenThen(
          "should reject with 400 if the content is empty",
          { content: "", title: "valid" },
          TestData.Env.create({}),
          (response) => expect(response.statusCode).toEqual(400),
        ),
        Jest.givenWhenThen(
          "should return with 200 + id of the created todo",
          { content: "foo", title: "bar" },
          TestData.Env.create({
            repositories: {
              event: {
                addEvent: () =>
                  taskEither.right(TestData.Event.createBuyIcecream),
              },
            },
          }),
          (response) => {
            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual(
              TestData.Event.createBuyIcecream.domainEvent.payload.id,
            );
          },
        ),
        Jest.givenWhenThen(
          "should return 500 if the repo throws",
          { content: "foo", title: "bar" },
          TestData.Env.create({}),
          (response) => {
            expect(response.statusCode).toEqual(500);
          },
        ),
      ],
    );
  });
});
