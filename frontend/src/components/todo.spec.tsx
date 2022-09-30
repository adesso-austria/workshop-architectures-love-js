import React from "react";
import { within } from "@testing-library/react";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Test from "../test";
import { render } from "../test/render";
import * as Async from "../store/async";
import { Todo } from "./todo";

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
    const todo = Test.Data.Todo.buyIcecream;
    const result = render(<Todo todo={todo} />, {
      preloadedState: {
        todo: {
          todos: Async.of({
            [todo.id]: pipe(Async.of(todo), Async.setPending("updating")),
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

  it("should be show an error and be disabled if fetching content failed", async () => {
    const todo = Test.Data.Todo.buyIcecream;
    const result = render(<Todo todo={todo} />, {
      preloadedState: {
        todo: {
          todos: Async.of({
            [todo.id]: pipe(
              Async.of(todo),
              Async.setError("fetching content", "bar"),
            ),
          }),
        },
      },
    });

    const showContent = result.getByRole("button", { name: "show content" });

    await result.user.click(showContent);

    const content = result.getByRole("presentation", { name: "content" });
    const textArea = within(content).getByRole("textbox");

    expect(
      within(content).queryByRole("alert", { name: "fetching failed" }),
    ).not.toBeNull();

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
