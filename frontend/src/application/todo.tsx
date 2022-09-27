import {
  Button,
  Checkbox,
  IconButton,
  Input,
  Textarea,
} from "@material-tailwind/react";
import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { equals } from "ramda";
import React from "react";
import * as Icons from "react-icons/md";
import * as Domain from "../domain";
import * as Store from "../store";

export const Todo = ({ todo: propTodo }: { todo: Domain.Todo.Todo }) => {
  const [todo, setTodo] = React.useState(propTodo);
  React.useLayoutEffect(() => {
    setTodo(propTodo);
  }, [propTodo]);

  const { title } = todo;

  const {
    saveTodo,
    deleteTodo,
    fetchContent,
    isDeleting,
    isFetching,
    isUpdating,
  } = Store.Todo.useTodoTasks(todo);

  const [showContent, setShowContent] = React.useState(false);

  React.useEffect(() => {
    if (showContent) {
      fetchContent();
    }
  }, [showContent]);

  return (
    <div className="flex gap-2 items-start">
      <Checkbox
        checked={propTodo.isDone}
        onChange={(e) => saveTodo({ ...todo, isDone: e.target.checked })}
      />
      <div className="flex flex-col grow relative pt-2">
        <Input
          aria-label="title"
          label="Title"
          color={todo.title === propTodo.title ? "blue" : "orange"}
          icon={
            todo.title === propTodo.title ? undefined : (
              <Icons.MdWarning
                role="status"
                aria-label="unsaved changes"
                fill="orange"
              />
            )
          }
          placeholder="What to do..."
          variant="static"
          value={title}
          onChange={(e) =>
            setTodo((current) => ({
              ...current,
              title: e.target.value,
            }))
          }
          onBlur={() => saveTodo(todo)}
        />
        <div
          className="hover:bg-gray-100 flex justify-center"
          onClick={() => setShowContent((current) => !current)}
          role="button"
          aria-label="show content"
        >
          <Icons.MdChevronLeft
            style={{
              transform: `rotate(${showContent ? -90 : 90}deg)`,
              transition: "transform 150ms ease",
            }}
          />
        </div>
        {showContent && (
          <div
            role="presentation"
            aria-label="content"
            className="relative top-4"
          >
            {!equals(todo.content, propTodo.content) && (
              <Icons.MdWarning
                role="status"
                aria-label="unsaved changes"
                className="absolute top-0 right-0"
                fill="orange"
              />
            )}
            <Textarea
              variant="static"
              color={equals(todo.content, propTodo.content) ? "blue" : "orange"}
              aria-label="content"
              label="Description"
              placeholder="Could you elaborate?"
              disabled={isFetching || isUpdating}
              value={pipe(
                todo.content,
                option.getOrElse(() => ""),
              )}
              onChange={(e) =>
                setTodo((current) => ({
                  ...current,
                  content: option.some(e.target.value),
                }))
              }
              onBlur={() => saveTodo(todo)}
            />
          </div>
        )}
      </div>
      <IconButton
        aria-label="delete todo"
        size="sm"
        disabled={isDeleting}
        onClick={deleteTodo}
      >
        <Icons.MdDelete />
      </IconButton>
      <div>
        <div className="flex justify-end"></div>
      </div>
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
