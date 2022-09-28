import * as Contracts from "contracts";
import { LightMyRequestResponse } from "fastify";
import { option, taskEither } from "fp-ts";
import { Jest } from "test-utils";
import { DeepPartial } from "utils";
import { pipe } from "fp-ts/lib/function";
import { Application } from "../application";
import * as Test from "../test";
import * as Boundary from "./index";

Jest.testGivenThen<Application, (response: LightMyRequestResponse) => void>(
  "GET /todo",
  async (givenApplication, checkExpectation) => {
    const root = Boundary.create(Test.Application.create(givenApplication));
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
      Test.Application.create({
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
      Test.Application.create({
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
      Test.Application.create({
        todo: {
          getTodo: () => taskEither.right(Test.Data.Todo.buyIcecream),
        },
      }),
      (response) => {
        const todo = Test.Data.Todo.buyIcecream;
        const expectedBody: Contracts.components["schemas"]["Todo"] = {
          id: todo.id,
          title: todo.title,
          isDone: todo.isDone,
        };

        expect(response.statusCode).toEqual(200);
        expect(response.json()).toEqual(expectedBody);
      },
    ),
  ],
);

Jest.testGivenWhenThen<
  DeepPartial<Application>,
  Partial<Contracts.components["schemas"]["AddTodo"]>,
  (response: LightMyRequestResponse) => void
>(
  "POST /todo",
  async (givenApplication, whenPayload, expectResponse) => {
    const root = Boundary.create(Test.Application.create(givenApplication));

    const response = await root.inject({
      path: "/todo",
      method: "POST",
      payload: whenPayload,
    });
    expectResponse(response);
  },
  [
    Jest.givenWhenThen(
      "should reject with 400 if no title is present in the body",
      {},
      {
        content: "test",
      },
      (response) => {
        expect(response.statusCode).toEqual(400);
      },
    ),
    Jest.givenWhenThen(
      "should reject with 400 if the title is empty",
      {},
      { content: "valid", title: "" },
      (response) => {
        expect(response.statusCode).toEqual(400);
      },
    ),
    Jest.givenWhenThen(
      "should reject with 500 if the application errors",
      {
        todo: {
          addTodo: () => taskEither.left("some error"),
        },
      },
      { content: "foo", title: "bar" },
      (response) => {
        expect(response.statusCode).toEqual(500);
      },
    ),
    Jest.givenWhenThen(
      "should return with 200 + id of the created todo",
      {
        todo: {
          addTodo: () => taskEither.right(Test.Data.Todo.buyIcecream),
        },
      },
      { content: "foo", title: "bar" },
      (response) => {
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(Test.Data.Todo.buyIcecream.id);
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
    const root = Boundary.create(Test.Application.create(givenApplication));
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
          getTodo: () => taskEither.right(Test.Data.Todo.buyIcecream),
        },
      },
      { id: "foo" },
      (res) => {
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(
          pipe(
            Test.Data.Todo.buyIcecream.content,
            option.getOrElse(() => ""),
          ),
        );
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
    const root = Boundary.create(Test.Application.create(givenApplication));

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
          getTodos: () => taskEither.right([Test.Data.Todo.buyMilk]),
        },
      },
      (res) => {
        const todo = Test.Data.Todo.buyMilk;
        const expectedBody: Array<Contracts.components["schemas"]["Todo"]> = [
          {
            id: todo.id,
            title: todo.title,
            isDone: todo.isDone,
          },
        ];

        expect(res.json()).toEqual(expectedBody);
      },
    ),
  ],
);

test.each<
  [
    string,
    DeepPartial<Application>,
    string | undefined,
    (res: LightMyRequestResponse) => void,
  ]
>([
  [
    "should reject with 400 if id is missing",
    {},
    undefined,
    (res) => expect(res.statusCode).toEqual(400),
  ],
  [
    "should reject with 400 if id is empty",
    {},
    "",
    (res) => expect(res.statusCode).toEqual(400),
  ],
  [
    "should reject with 500 if application errors",
    { todo: { deleteTodo: () => taskEither.left("some error") } },
    "foo",
    (res) => expect(res.statusCode).toEqual(500),
  ],
  [
    "should return 204 if application succeeds",
    { todo: { deleteTodo: () => taskEither.right(undefined) } },
    "foo",
    (res) => expect(res.statusCode).toEqual(204),
  ],
])("%s", async (_, givenApplication, whenId, assertResponse) => {
  const root = Boundary.create(Test.Application.create(givenApplication));

  const res = await root.inject({
    path: "/todo",
    method: "DELETE",
    query: whenId == null ? {} : { id: whenId },
  });

  assertResponse(res);
});

test.each<
  [
    string,
    DeepPartial<Application>,
    DeepPartial<Contracts.components["schemas"]["UpdateTodo"]>,
    (res: LightMyRequestResponse) => void,
  ]
>([
  [
    "should reject with 400 if id is missing",
    {},
    { title: "foo", content: "bar", isDone: false },
    (res) => expect(res.statusCode).toEqual(400),
  ],
  [
    "should reject with 400 if title is missing",
    {},
    { id: "foo", content: "bar", isDone: false },
    (res) => expect(res.statusCode).toEqual(400),
  ],
  [
    "should reject with 400 if isDone is missing",
    {},
    { id: "foo", content: "bar", title: "baz" },
    (res) => expect(res.statusCode).toEqual(400),
  ],
  [
    "should reject with 404 if todo can't be found",
    { todo: { updateTodo: () => taskEither.left("not found") } },
    { id: "foo", content: "bar", title: "baz", isDone: false },
    (res) => expect(res.statusCode).toEqual(404),
  ],
  [
    "should return 200 if update is successful",
    { todo: { updateTodo: () => taskEither.right(undefined) } },
    { id: "foo", content: "bar", title: "baz", isDone: false },
    (res) => expect(res.statusCode).toEqual(204),
  ],
])("%s", async (_, givenApplication, whenRequest, assertResponse) => {
  const root = Boundary.create(Test.Application.create(givenApplication));

  const res = await root.inject({
    path: "/todo",
    method: "PUT",
    payload: whenRequest,
  });

  assertResponse(res);
});
