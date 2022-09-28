import { either, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException, throwIfCalled } from "utils";
import * as Test from "../test";
import * as Api from "./api";
import * as Fetcher from "./fetcher";

describe("addTodo", () => {
  it("should return a domain todo for a 200 response", async () => {
    const api = Api.create(
      Test.Api.Fetcher.create({
        postTodo: () => taskEither.right(Test.Api.Fetcher.Response.ok("foo")),
      }),
    );

    const response = await api.addTodo({ title: "test" })();

    pipe(
      response,
      either.match(throwException, (todo) => {
        expect(todo).toEqual({
          id: "foo",
          title: "test",
          content: option.none,
          isDone: false,
        });
      }),
    );
  });
});

describe("deleteTodo", () => {
  it("should return right undefined for a 200 response", async () => {
    const api = Api.create(
      Test.Api.Fetcher.create({
        deleteTodo: () => taskEither.right(Test.Api.Fetcher.Response.ok("")),
      }),
    );

    const response = await api.deleteTodo("foo")();

    pipe(response, either.match(throwException, ignore));
  });
});

describe("fetchContent", () => {
  it.each<
    [
      string,
      taskEither.TaskEither<
        string,
        Fetcher.Response<200 | 400 | 404 | 500, string>
      >,
      either.Either<string, string>,
    ]
  >([
    [
      "should return right content for a 200 response",
      taskEither.right(Test.Api.Fetcher.Response.status(200, "bar")),
      either.right("bar"),
    ],
    [
      "should return left error for a 400 response",
      taskEither.right(Test.Api.Fetcher.Response.status(400, "bar")),
      either.left("bar"),
    ],
    [
      "should return left error for a 404 response",
      taskEither.right(Test.Api.Fetcher.Response.status(404, "bar")),
      either.left("bar"),
    ],
    [
      "should return left error for a 500 response",
      taskEither.right(Test.Api.Fetcher.Response.status(500, "bar")),
      either.left("bar"),
    ],
  ])("%s", async (_, givenResponse, expectedResult) => {
    const api = Api.create(
      Test.Api.Fetcher.create({
        getTodoContent: () => givenResponse,
      }),
    );

    const task = api.fetchContent("foo");

    expect(await task()).toEqual(expectedResult);
  });
});

describe("updateTodo", () => {
  it.each<
    [
      string,
      ReturnType<Fetcher.Fetcher["putTodo"]>,
      (result: either.Either<string, void>) => void,
    ]
  >([
    [
      "should return left for a 500 error",
      taskEither.right(Test.Api.Fetcher.Response.status(500, "")),
      either.match(ignore, throwIfCalled("expected a left")),
    ],
    [
      "should return left for a 404 error",
      taskEither.right(Test.Api.Fetcher.Response.status(404, "")),
      either.match(ignore, throwIfCalled("expected a left")),
    ],
    [
      "should return right for a 204 response",
      taskEither.right(Test.Api.Fetcher.Response.status(204, "")),
      either.match(throwException, ignore),
    ],
  ])("%s", async (_, apiResponse, assertResult) => {
    const api = Api.create(
      Test.Api.Fetcher.create({
        putTodo: () => apiResponse,
      }),
    );

    const update = api.updateTodo(Test.Data.Todo.buyIcecream);

    assertResult(await update());
  });
});
