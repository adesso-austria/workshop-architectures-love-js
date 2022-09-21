import { expect } from "@jest/globals";
import { LightMyRequestResponse } from "fastify";
import { option, taskEither } from "fp-ts";
import { Jest } from "test-utils";
import { DeepPartial } from "utils";
import { Application } from "../application";
import * as Domain from "../domain";
import * as TestData from "../test-data";
import * as Boundary from "./index";

Jest.testGivenThen<Application, (response: LightMyRequestResponse) => void>(
  "GET /todo",
  async (givenApplication, checkExpectation) => {
    const root = Boundary.create(TestData.Application.create(givenApplication));
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
      TestData.Application.create({
        todo: {
          getTodo: () => taskEither.left("db error"),
        },
      }),
      (response) => {
        expect(response.statusCode).toEqual(500);
      },
    ),
    Jest.givenThen(
      "should return status 404 if the todo can't be found",
      TestData.Application.create({
        todo: {
          getTodo: () => taskEither.left("not found"),
        },
      }),
      (response) => {
        expect(response.statusCode).toEqual(404);
      },
    ),
    Jest.givenThen(
      "should return the todo with status 200 if it could be found",
      TestData.Application.create({
        todo: {
          getTodo: () => taskEither.right(TestData.Todo.buyIcecream),
        },
      }),
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
  DeepPartial<Application>,
  (response: LightMyRequestResponse) => void
>(
  "POST /todo",
  async (givenPayload, whenApplication, expectResponse) => {
    const root = Boundary.create(TestData.Application.create(whenApplication));

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
      {},
      (response) => {
        expect(response.statusCode).toEqual(400);
      },
    ),
    Jest.givenWhenThen(
      "should reject with 400 if the title is empty",
      { content: "valid", title: "" },
      {},
      (response) => {
        expect(response.statusCode).toEqual(400);
      },
    ),
    Jest.givenWhenThen(
      "should reject with 400 if no content is present in the body",
      {
        title: "test",
      },
      {},
      (response) => {
        expect(response.statusCode).toEqual(400);
      },
    ),
    Jest.givenWhenThen(
      "should reject with 400 if the content is empty",
      { content: "", title: "valid" },
      {},
      (response) => expect(response.statusCode).toEqual(400),
    ),
    Jest.givenWhenThen(
      "should reject with 500 if the repo throws",
      { content: "foo", title: "bar" },
      {
        repositories: {
          event: {
            addEvent: () => taskEither.left("some error"),
          },
        },
      },
      (response) => {
        expect(response.statusCode).toEqual(500);
      },
    ),
    Jest.givenWhenThen(
      "should return with 200 + id of the created todo",
      { content: "foo", title: "bar" },
      {
        repositories: {
          event: {
            addEvent: () => taskEither.right(TestData.Event.createBuyIcecream),
          },
        },
      },
      (response) => {
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(
          TestData.Event.createBuyIcecream.domainEvent.payload.id,
        );
      },
    ),
  ],
);

Jest.testGivenWhenThen<
  DeepPartial<Application>,
  Record<string, string>,
  (response: LightMyRequestResponse) => void
>(
  "GET /todoContent",
  async (givenApplication, whenRequestedQuery, assertExpectation) => {
    const root = Boundary.create(TestData.Application.create(givenApplication));
    const response = await root.inject({
      path: "/todoContent",
      query: whenRequestedQuery,
    });

    assertExpectation(response);
  },
  [
    Jest.givenWhenThen("should return 400 if id is missing", {}, {}, (res) =>
      expect(res.statusCode).toEqual(400),
    ),
    Jest.givenWhenThen(
      "should return 400 if id is empty",
      { id: "" },
      {},
      (res) => expect(res.statusCode).toEqual(400),
    ),
    Jest.givenWhenThen(
      "should return 404 if todo could not be found",
      {
        todo: {
          getTodo: () => taskEither.left("not found"),
        },
      },
      { id: "foo" },
      (res) => expect(res.statusCode).toEqual(404),
    ),
    Jest.givenWhenThen(
      "should return 500 if application throws",
      {
        todo: {
          getTodo: () => taskEither.left("db error"),
        },
      },
      { id: "foo" },
      (res) => expect(res.statusCode).toEqual(500),
    ),
    Jest.givenWhenThen(
      "should return 200 content if todo could be found",
      {
        todo: {
          getTodo: () => taskEither.right(TestData.Todo.buyIcecream),
        },
      },
      { id: "foo" },
      (res) => {
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(TestData.Todo.buyIcecream.content);
      },
    ),
  ],
);

Jest.testGivenThen<
  DeepPartial<Application>,
  (response: LightMyRequestResponse) => void
>(
  "GET /todos",
  async (givenApplication, assertExpectation) => {
    const root = Boundary.create(TestData.Application.create(givenApplication));

    const response = await root.inject({
      path: "/todos",
    });

    assertExpectation(response);
  },
  [
    Jest.givenThen(
      "should return with 200 + empty array if application returns no todos",
      {
        todo: {
          getTodos: () => taskEither.right([]),
        },
      },
      (res) => {
        expect(res.statusCode).toEqual(200);
        expect(res.json()).toEqual([]);
      },
    ),
    Jest.givenThen(
      "should reject with 500 if repo throws",
      {
        todo: {
          getTodos: () => taskEither.left("db error"),
        },
      },
      (res) => expect(res.statusCode).toEqual(500),
    ),
    Jest.givenThen(
      "should map domain to contract",
      {
        todo: {
          getTodos: () => taskEither.right([TestData.Todo.buyMilk]),
        },
      },
      (res) => {
        expect(res.json()).toEqual([
          Boundary.Todo.fromDomain(TestData.Todo.buyMilk),
        ]);
      },
    ),
  ],
);
