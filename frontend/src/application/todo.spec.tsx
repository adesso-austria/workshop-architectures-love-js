import React from "react";
import {
  ByRoleMatcher,
  ByRoleOptions,
  waitFor,
  within,
} from "@testing-library/react";
import { option, taskEither } from "fp-ts";
import * as Test from "../test";
import * as Domain from "../domain";
import * as Async from "../store/async";
import { render } from "../test/render";
import { TodoPreview, Overview } from "./todo";

describe("todo preview", () => {
  it("should display the title", async () => {
    const todo = Test.Data.Todo.buyIcecream;
    const result = render(<TodoPreview todo={todo} />);
    expect(result.getByRole("heading")).toHaveTextContent(todo.title);
  });

  it.todo("should display an error message when fetching the content failed");

  it.todo("should display as disabled while some task is pending");

  describe("content", () => {
    it("should display a skeleton while content is missing", async () => {
      const todo: Domain.Todo.Todo = {
        id: option.some("foo"),
        title: "bar",
        content: option.none,
        isDone: option.none,
      };
      const result = render(<TodoPreview todo={todo} />);
      const expandContent = result.getByRole("button", {
        name: "show content",
      });
      await result.user.click(expandContent);
      expect(
        result.queryByRole("presentation", { name: "skeleton" }),
      ).not.toBeNull();
    });

    it("should display the content when present", async () => {
      const todo: Domain.Todo.Todo = {
        id: option.some("foo"),
        title: "bar",
        content: option.some("baz"),
        isDone: option.none,
      };
      const result = render(<TodoPreview todo={todo} />);
      const expandContent = result.getByRole("button", {
        name: "show content",
      });
      await result.user.click(expandContent);
      expect(
        result.getByRole("presentation", { name: "content" }),
      ).toHaveTextContent("baz");
    });
  });

  describe("delete button", () => {
    it("should be disabled while the deletion is pending", async () => {
      const todo = Test.Data.Todo.buyIcecream;

      const result = render(<TodoPreview todo={todo} />, {
        preloadedState: {
          todo: {
            todos: Async.of({
              foo: Async.of(todo, { deleting: { state: "pending" } }),
            }),
          },
        },
      });

      expect(
        result.getByRole("button", { name: "delete todo" }),
      ).toBeDisabled();
    });

    it("should mark the whole todo as disabled if some tasks are pending", async () => {
      const todo = Test.Data.Todo.buyIcecream;

      const result = render(<TodoPreview todo={todo} />, {
        preloadedState: {
          todo: {
            todos: Async.of({
              foo: Async.of(todo, { deleting: { state: "pending" } }),
            }),
          },
        },
      });

      expect(result.container.firstElementChild!).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });
});

describe("overview", () => {
  it("should display one todo component for each fetched todo", async () => {
    const todos: Domain.Todo.Todo[] = [Test.Data.Todo.buyIcecream];

    const result = render(<Overview />, {
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
      const result = render(<Overview />);

      const title = result.getByRole(...titleQuery);

      await result.user.clear(title);

      expect(result.getByRole(...saveQuery)).toBeDisabled();
    });

    it("should be disabled if content is empty", async () => {
      const result = render(<Overview />);

      const content = result.getByRole(...contentQuery);

      await result.user.clear(content);

      expect(result.getByRole(...saveQuery)).toBeDisabled();
    });

    it("should enable saving only after todos are fetched and content + title are set", async () => {
      const result = render(<Overview />, {
        api: {
          fetchTodos: () => taskEither.right([]),
        },
      });

      const form = result.getByRole(...formQuery);
      const saveButton = within(form).getByRole(...saveQuery);

      expect(saveButton).toBeDisabled();

      await result.user.clear(within(form).getByRole(...titleQuery));
      await result.user.keyboard("ignoring it in mock api");

      expect(saveButton).toBeDisabled();

      await result.user.clear(within(form).getByRole(...contentQuery));
      await result.user.keyboard("ignoring it in mock api");

      await waitFor(() => expect(saveButton).toBeEnabled());
    });

    it("should add the todo on save", async () => {
      const result = render(<Overview />, {
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

      await result.findByRole("listitem", { name: "todo" });
    });

    it("should clear the form on successful save", async () => {
      const result = render(<Overview />, {
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

    it("should not clear the form on erroneous save", async () => {
      const result = render(<Overview />, {
        api: {
          fetchTodos: () => taskEither.right([]),
          addTodo: () => taskEither.left("some error"),
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
        expect(title).toHaveValue("foo");
        expect(content).toHaveValue("bar");
      });
    });
  });
});
