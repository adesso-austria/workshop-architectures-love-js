import React from "react";
import * as Store from "../store";
import { Todo } from "./todo";

/**
 * renders an overview over the current todos
 */
export const Overview = function TodoOverview() {
  const { todos } = Store.Todo.useTodos();

  return (
    <>
      {todos.map((todo) => (
        <div key={todo.id} role="listitem" aria-label="todo">
          <Todo todo={todo} />
        </div>
      ))}
    </>
  );
};
