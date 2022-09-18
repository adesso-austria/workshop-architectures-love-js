import { either, option, taskEither } from "fp-ts";
import * as Domain from "../domain";
import * as Test from "../test";
import * as Api from "./api";

describe("addTodo", () => {
  it("should return a domain todo for a 200 response", async () => {
    const api = Api.create(
      Test.Api.Fetcher.create({
        postTodo: () =>
          taskEither.right(
            Test.Api.Fetcher.Response.ok({
              id: "foo",
              content: { href: "/todo/foo", rel: "content" },
            }),
          ),
      }),
    );

    const response = await api.addTodo({ title: "test", content: "test" })();

    expect(response).toEqual(
      either.right({
        id: option.some("foo"),
        title: "test",
        content: Domain.Hateoas.of(
          { href: "/todo/foo", rel: "content" },
          "test",
        ),
      }),
    );
  });
});
