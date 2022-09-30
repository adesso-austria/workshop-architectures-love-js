import { IconButton, Input } from "@material-tailwind/react";
import React from "react";
import * as Icons from "react-icons/md";
import * as Store from "../store";

/**
 * a small form to add a new todo
 */
export const NewTodo = function NewTodo() {
  const { pending } = Store.Todo.useTodos();

  const [newTodo, setNewTodo] = Store.Todo.useNewTodo();
  const addTodo = Store.Todo.useAddTodo();

  return (
    <form aria-label="new todo">
      <div className="flex gap-4 pl-[3.2rem] py-4 justify-between items-center">
        <Input
          variant="standard"
          aria-label="title"
          label="What to do..."
          value={newTodo.title}
          onChange={(e) =>
            setNewTodo((current) => ({
              ...current,
              title: e.target.value,
            }))
          }
        />
        <IconButton
          aria-label="save todo"
          size="sm"
          disabled={pending || newTodo.title === ""}
          onClick={() => addTodo(newTodo)}
          className="w-full"
        >
          <Icons.MdAdd />
        </IconButton>
      </div>
    </form>
  );
};
