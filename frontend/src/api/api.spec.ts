import { either, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { throwException } from "utils";
import * as Test from "../test";
import * as Api from "./api";

describe("addTodo", () => {
  it("should return a domain todo for a 200 response", async () => {
    const api = Api.create(
      Test.Api.Fetcher.create({
        postTodo: () => taskEither.right(Test.Api.Fetcher.Response.ok("foo")),
      }),
    );

    const response = await api.addTodo({ title: "test", content: "test" })();

    pipe(
      response,
      either.match(throwException, (todo) => {
        expect(todo).toEqual({
          id: option.some("foo"),
          title: "test",
          content: option.none,
        });
      }),
    );
  });
});
