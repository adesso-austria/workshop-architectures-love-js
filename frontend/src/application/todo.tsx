import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  Button,
  Input,
  Textarea,
} from "@material-tailwind/react";
import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import React from "react";
import * as Domain from "../domain";
import * as Store from "../store";

export const TodoPreview = ({ todo }: { todo: Domain.Todo.Todo }) => {
  const [showContent, setShowContent] = React.useState(false);

  return (
    <div>
      <div>
        <h3>{todo.title}</h3>
        <button aria-label="delete todo">Delete</button>
      </div>
      <Accordion open={showContent}>
        <AccordionHeader
          role="button"
          aria-label="show content"
          onClick={() => setShowContent((current) => !current)}
        >
          Content
        </AccordionHeader>
        <AccordionBody>
          {pipe(
            todo.content,
            option.match(
              () => (
                <div role="presentation" aria-label="skeleton">
                  loading...
                </div>
              ),
              (content) => (
                <div role="presentation" aria-label="content">
                  {content}
                </div>
              ),
            ),
          )}
        </AccordionBody>
      </Accordion>
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
        <Input
          variant="static"
          aria-label="title"
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
          value={newTodo.content}
          onChange={(e) =>
            setNewTodo((current) => ({
              ...current,
              content: e.target.value,
            }))
          }
        />
        <Button
          aria-label="save todo"
          disabled={pending || newTodo.title === "" || newTodo.content === ""}
          onClick={() => addTodo(newTodo)}
        >
          Save
        </Button>
      </form>
      {todos.map((todo, i) => (
        <div
          key={pipe(
            todo.id,
            option.getOrElse(() => i.toString()),
          )}
          role="listitem"
          aria-label="todo"
        >
          <TodoPreview todo={todo} />
        </div>
      ))}
    </>
  );
};
