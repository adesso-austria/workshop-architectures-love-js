import React from "react";
import {
  ByRoleMatcher,
  ByRoleOptions,
  waitFor,
  within,
} from "@testing-library/react";
import { taskEither } from "fp-ts";
import * as Test from "../test";
import * as Domain from "../domain";
import { Overview } from "./todo";

describe("todo", () => {
  it.todo("should display the title");

  it.todo("should display a skeleton for the content while pending");

  it.todo("should display the content when resolved");

  it.todo("should display an error message when fetching the content failed");
});

describe("overview", () => {
  it("should display one todo component for each fetched todo", async () => {
    const todos: Domain.Todo.Todo[] = [Test.Data.Todo.buyIcecream];

    const result = Test.render(<Overview />, {
      api: {
        fetchTodos: () => taskEither.right(todos),
      },
    });

    expect(
      await result.findAllByRole("listitem", { name: "todo" }),
    ).toHaveLength(todos.length);
  });

  describe("save button", () => {
    type Query = [ByRoleMatcher, ByRoleOptions];
    const formQuery: Query = ["form", { name: "new todo" }];
    const titleQuery: Query = ["textbox", { name: "title" }];
    const contentQuery: Query = ["textbox", { name: "content" }];
    const saveQuery: Query = ["button", { name: "save todo" }];

    it("should be disabled if title is empty", async () => {
      const result = Test.render(<Overview />);

      const title = result.getByRole(...titleQuery);

      await result.user.clear(title);

      expect(result.getByRole(...saveQuery)).toBeDisabled();
    });

    it("should be disabled if content is empty", async () => {
      const result = Test.render(<Overview />);

      const content = result.getByRole(...contentQuery);

      await result.user.clear(content);

      expect(result.getByRole(...saveQuery)).toBeDisabled();
    });

    it("should be disabled if todos are pending", async () => {
      const result = Test.render(<Overview />); // todos are initially pending

      expect(result.getByRole(...saveQuery)).toBeDisabled();
    });

    it("should enable saving if todos are fetched and content + title are set", async () => {
      const result = Test.render(<Overview />, {
        api: {
          fetchTodos: () => taskEither.right([]),
        },
      });

      const form = result.getByRole(...formQuery);
      await result.user.clear(within(form).getByRole(...titleQuery));
      await result.user.keyboard("ignoring it in mock api");

      await result.user.clear(within(form).getByRole(...contentQuery));
      await result.user.keyboard("ignoring it in mock api");

      await waitFor(() => expect(result.getByRole(...saveQuery)).toBeEnabled());
    });

    it("should add the todo on save", async () => {
      const result = Test.render(<Overview />, {
        api: {
          fetchTodos: () => taskEither.right([]),
          addTodo: () => taskEither.right(Test.Data.Todo.buyIcecream),
        },
      });

      const form = result.getByRole(...formQuery);
      await result.user.clear(within(form).getByRole(...titleQuery));
      await result.user.keyboard("ignoring it in mock api");

      await result.user.clear(within(form).getByRole(...contentQuery));
      await result.user.keyboard("ignoring it in mock api");

      const saveButton = within(form).getByRole(...saveQuery);
      await result.user.click(saveButton);

      await waitFor(() =>
        expect(result.store.getState().todo.todos).toEqual(
          Domain.Async.of([Test.Data.Todo.buyIcecream]),
        ),
      );
    });

    it("should clear the form on successful save", async () => {
      const result = Test.render(<Overview />, {
        api: {
          fetchTodos: () => taskEither.right([]),
          addTodo: () => taskEither.right(Test.Data.Todo.buyIcecream),
        },
      });

      const title = result.getByRole(...titleQuery);
      await result.user.clear(title);
      await result.user.keyboard("foo");

      const content = result.getByRole(...contentQuery);
      await result.user.clear(content);
      await result.user.keyboard("bar");

      await result.user.click(result.getByRole(...saveQuery));

      await waitFor(() => {
        expect(title).toHaveValue("");
        expect(content).toHaveValue("");
      });
    });

    it.todo("should not clear the form on erroneous save");
  });
});
