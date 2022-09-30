import { taskEither } from "fp-ts";
import React from "react";
import { demoize } from "../test/demoize";
import * as Test from "../test";
import * as Store from "../store";
import * as Async from "../store/async";
import { Todo } from "./todo";

demoize(
  "todo",
  () => {
    const { todos } = Store.Todo.useTodos();
    const todo = todos.find(({ id }) => id === Test.Data.Todo.buyIcecream.id);
    if (todo == null) {
      throw new Error("invalid store setup");
    }
    return <Todo todo={todo} />;
  },
  {
    store: {
      todo: {
        todos: Async.of({
          [Test.Data.Todo.buyIcecream.id]: Async.of(Test.Data.Todo.buyIcecream),
        }),
      },
    },
    api: {
      fetchContent: () => taskEither.right("foo"),
      updateTodo: () => taskEither.right(undefined),
    },
  },
);
