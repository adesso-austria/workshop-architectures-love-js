import { describe, expect } from "@jest/globals";
import { LightMyRequestResponse } from "fastify";
import { option, taskEither } from "fp-ts";
import { Jest } from "utils";
import * as Application from "../application";
import * as Domain from "../domain";
import * as TestData from "../test-data";
import * as Main from "./main";
import * as Todo from "./todo";

describe("todo boundary", () => {
  Jest.testGivenThen<
    Application.Env.Env,
    (response: LightMyRequestResponse) => void
  >(
    "/todo",
    async (givenEnv, checkExpectation) => {
      const root = Main.create(TestData.Env.create(givenEnv));
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
        TestData.Env.create({
          repositories: {
            todo: {
              getTodo: () => taskEither.left("something's up"),
            },
          },
        }),
        (response) => {
          expect(response.statusCode).toEqual(500);
        },
      ),
      Jest.givenThen(
        "should return status 404 if the todo can't be found",
        TestData.Env.create({
          repositories: {
            todo: {
              getTodo: () => taskEither.right(option.none),
            },
          },
        }),
        (response) => {
          expect(response.statusCode).toEqual(404);
        },
      ),
      Jest.givenThen(
        "should return the todo with status 200 if it could be found",
        TestData.Env.create({
          repositories: {
            todo: {
              getTodo: () =>
                taskEither.right(option.some(TestData.Todo.buyIcecream)),
            },
          },
        }),
        (response) => {
          expect(response.statusCode).toEqual(200);
          expect(response.json()).toEqual(
            Todo.fromDomain(TestData.Todo.buyIcecream),
          );
        },
      ),
    ],
  );

  Jest.testGivenWhenThen<
    Partial<Domain.AddTodo.AddTodo>,
    Application.Env.Env,
    (response: LightMyRequestResponse) => void
  >(
    "POST /todo",
    async (givenPayload, whenEnv, expectResponse) => {
      const root = Main.create(whenEnv);

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
