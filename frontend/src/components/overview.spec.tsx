import React from "react";
import { taskEither } from "fp-ts";
import * as Test from "../test";
import * as Domain from "../domain";
import { render } from "../test/render";
import { Overview } from "./overview";

it("should display one todo component for each fetched todo", async () => {
  const todos: Domain.Todo.Todo[] = [Test.Data.Todo.buyIcecream];

  const result = render(<Overview />, {
    api: {
      fetchTodos: () => taskEither.right(todos),
    },
  });

  expect(await result.findAllByRole("listitem", { name: "todo" })).toHaveLength(
    todos.length,
  );
});
