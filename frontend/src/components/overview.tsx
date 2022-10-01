import { either } from "fp-ts";
import React from "react";
import { ignore } from "utils";
import * as Api from "../api";
import * as Domain from "../domain";
import { Todo } from "./todo";

/**
 * renders an overview over the current todos
 */
export const Overview = function TodoOverview() {
  const [todos, setTodos] = React.useState([] as Domain.Todo.Todo[]);

  const api = Api.useApi();

  React.useEffect(() => {
    const fetchTodos = api.fetchTodos();
    fetchTodos().then(either.match(ignore, (todos) => setTodos(todos)));
  }, []);

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
