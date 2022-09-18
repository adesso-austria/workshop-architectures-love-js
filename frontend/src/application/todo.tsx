import { Button } from "@material-tailwind/react";
import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import React from "react";
import * as Store from "../store";

export const Todo = () => {
  return <>Todo</>;
};

export const Overview = function TodoOverview() {
  const { todos } = Store.Todo.useTodos();

  return (
    <>
      {todos.map((todo, i) => (
        <Todo
          key={pipe(
            todo.id,
            option.getOrElse(() => i.toString()),
          )}
        />
      ))}
      <Button aria-label="add todo">Add Todo</Button>
    </>
  );
};
