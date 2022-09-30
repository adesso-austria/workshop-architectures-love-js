import React from "react";
import {
  ByRoleMatcher,
  ByRoleOptions,
  waitFor,
  within,
} from "@testing-library/react";
import { taskEither } from "fp-ts";
import * as Test from "../test";
import { render } from "../test/render";
import { NewTodo } from "./new-todo";

describe("save button", () => {
  type Query = [ByRoleMatcher, ByRoleOptions];
  const formQuery: Query = ["form", { name: "new todo" }];
  const titleQuery: Query = ["textbox", { name: "title" }];
  const saveQuery: Query = ["button", { name: "save todo" }];

  it("should be disabled if title is empty", async () => {
    const result = render(<NewTodo />);

    const title = result.getByRole(...titleQuery);

    await result.user.clear(title);

    expect(result.getByRole(...saveQuery)).toBeDisabled();
  });

  it("should enable saving only after todos are fetched and title is set", async () => {
    const result = render(<NewTodo />, {
      api: {
        fetchTodos: () => taskEither.right([]),
      },
    });

    const form = result.getByRole(...formQuery);
    const saveButton = within(form).getByRole(...saveQuery);

    expect(saveButton).toBeDisabled();

    await result.user.clear(within(form).getByRole(...titleQuery));
    await result.user.keyboard("ignoring it in mock api");

    await waitFor(() => expect(saveButton).toBeEnabled());
  });

  it("should clear the form on successful save", async () => {
    const result = render(<NewTodo />, {
      api: {
        fetchTodos: () => taskEither.right([]),
        addTodo: () => taskEither.right(Test.Data.Todo.buyIcecream),
      },
    });

    const title = result.getByRole(...titleQuery);
    await result.user.clear(title);
    await result.user.keyboard("foo");

    await result.user.click(result.getByRole(...saveQuery));

    await waitFor(() => {
      expect(title).toHaveValue("");
    });
  });

  it("should not clear the form on erroneous save", async () => {
    const result = render(<NewTodo />, {
      api: {
        fetchTodos: () => taskEither.right([]),
        addTodo: () => taskEither.left("some error"),
      },
    });

    const title = result.getByRole(...titleQuery);
    await result.user.clear(title);
    await result.user.keyboard("foo");

    await result.user.click(result.getByRole(...saveQuery));

    await waitFor(() => {
      expect(title).toHaveValue("foo");
    });
  });
});
