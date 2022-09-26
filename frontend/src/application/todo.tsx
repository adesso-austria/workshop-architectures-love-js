import {
  Button,
  Checkbox,
  IconButton,
  Input,
  Textarea,
} from "@material-tailwind/react";
import { equals } from "ramda";
import React from "react";
import * as Icons from "react-icons/md";
import * as Domain from "../domain";
import * as Store from "../store";

export const Todo = ({ todo: propTodo }: { todo: Domain.Todo.Todo }) => {
  const [todo, setTodo] = React.useState(propTodo);
  const { title } = todo;

  const { deleteTodo, isPending: isDeletePending } =
    Store.Todo.useDeleteTodo(propTodo);

  const hasUnsavedChanges = React.useMemo(
    () => !equals(todo, propTodo),
    [todo, propTodo],
  );

  return (
    <div>
      <Checkbox checked={todo.isDone} />
      <Input
        aria-label="title"
        label="Title"
        placeholder="What to do..."
        variant="static"
        value={title}
        onChange={(e) =>
          setTodo((current) => ({
            ...current,
            title: e.target.value,
          }))
        }
      />
      {hasUnsavedChanges && (
        <Icons.MdWarning role="status" aria-label="unsaved changes" />
      )}
      <IconButton
        aria-label="delete todo"
        size="sm"
        disabled={isDeletePending}
        onClick={deleteTodo}
      >
        <Icons.MdDelete />
      </IconButton>
    </div>
  );
};

export const Overview = function TodoOverview() {
  const { todos, pending } = Store.Todo.useTodos();

  const addTodo = Store.Todo.useAddTodo();

  const [newTodo, setNewTodo] = Store.Todo.useNewTodo();

  return (
    <>
      <form aria-label="new todo">
        <div className="flex flex-col gap-6">
          <Input
            variant="static"
            aria-label="title"
            label="Title"
            placeholder="What to do..."
            value={newTodo.title}
            onChange={(e) =>
              setNewTodo((current) => ({
                ...current,
                title: e.target.value,
              }))
            }
          />
          <Textarea
            variant="static"
            aria-label="content"
            label="Description"
            placeholder="Could you elaborate?"
            value={newTodo.content}
            onChange={(e) =>
              setNewTodo((current) => ({
                ...current,
                content: e.target.value,
              }))
            }
          />
        </div>
        <div className="flex justify-end">
          <Button
            aria-label="save todo"
            disabled={pending || newTodo.title === "" || newTodo.content === ""}
            onClick={() => addTodo(newTodo)}
          >
            Save
          </Button>
        </div>
      </form>
      {todos.map((todo) => (
        <div key={todo.id} role="listitem" aria-label="todo">
          <Todo todo={todo} />
        </div>
      ))}
    </>
  );
};
