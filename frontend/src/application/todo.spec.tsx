import React from "react";
import * as Test from "../test";
import * as Domain from "../domain";
import { Overview, Todo } from "./todo";

describe("todo", () => {
  it.todo("should display the title");

  it.todo("should display a skeleton for the content while pending");

  it.todo("should display the content when resolved");

  it.todo("should display an error message when fetching the content failed");
});

describe("overview", () => {
  it("should display one todo component for each fetched todo", () => {
    const todos: Domain.Todo.Todo[] = [Test.Data.Todo.buyIcecream];

    const result = Test.render(<Overview />, {
      preloadedState: {
        todo: {
          todos: Domain.Lazy.success(todos),
        },
      },
    });

    expect(result.root.findAllByType(Todo)).toHaveLength(todos.length);
  });
});
