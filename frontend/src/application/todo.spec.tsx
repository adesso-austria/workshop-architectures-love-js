import React from "react";
import {
  ByRoleMatcher,
  ByRoleOptions,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Test from "../test";
import * as Domain from "../domain";
import { render } from "../test/render";
import * as Async from "../store/async";
import { Overview, Todo } from "./todo";

describe("todo", () => {
  describe("title", () => {
    it("should be possible to change it", async () => {
      const result = render(<Todo todo={Test.Data.Todo.buyIcecream} />);

      const title = result.getByRole("textbox", { name: "title" });

      expect(title).toHaveValue(Test.Data.Todo.buyIcecream.title);

      await result.user.clear(title);
      await result.user.keyboard("foo");

      expect(title).toHaveValue("foo");
    });

    it("should show an unsaved icon on change", async () => {
      const result = render(<Todo todo={Test.Data.Todo.buyIcecream} />);

      const title = result.getByRole("textbox", { name: "title" });

      await result.user.clear(title);
      await result.user.keyboard("foo");

      await expect(
        result.findByRole("status", { name: "unsaved changes" }),
      ).resolves.toBeTruthy();
    });

    it.todo("should be disabled while anything is updating");

    it.todo("should save on blur");
  });

  describe("content", () => {
    it("should show an unsaved icon on change", async () => {
      const result = render(<Todo todo={Test.Data.Todo.buyIcecream} />);

      const showContent = result.getByRole("button", { name: "show content" });

      await result.user.click(showContent);

      const content = result.getByRole("presentation", { name: "content" });
      const textArea = within(content).getByRole("textbox");

      await result.user.clear(textArea);
      await result.user.keyboard("foo");

      expect(
        within(content).queryByRole("status", { name: "unsaved changes" }),
      ).not.toBeNull();
    });

    it("should be disabled if todo is updating", async () => {
      const result = render(<Todo todo={Test.Data.Todo.buyIcecream} />, {
        preloadedState: {
          todo: {
            todos: Async.of({
              [Test.Data.Todo.buyIcecream.id]: pipe(
                Async.of(Test.Data.Todo.buyIcecream),
                Async.setPending("updating"),
              ),
            }),
          },
        },
      });

      const showContent = result.getByRole("button", { name: "show content" });

      await result.user.click(showContent);

      const content = result.getByRole("presentation", { name: "content" });
      const textArea = within(content).getByRole("textbox");

      expect(textArea).toBeDisabled();
    });
  });

  describe("delete button", () => {
    it("should request to remove the todo", async () => {
      const todo = Test.Data.Todo.buyIcecream;
      const deleteTodo = jest.fn(() => taskEither.right(undefined));
      const result = render(<Todo todo={todo} />, {
        preloadedState: {
          todo: {
            todos: Async.of({
              [todo.id]: Async.of(todo),
            }),
          },
        },
        api: {
          deleteTodo,
        },
      });

      await result.user.click(
        result.getByRole("button", { name: "delete todo" }),
      );

      expect(deleteTodo).toHaveBeenCalled();
    });

    it.todo("should be disabled during updates");
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
