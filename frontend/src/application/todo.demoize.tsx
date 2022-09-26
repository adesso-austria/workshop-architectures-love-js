import { option, taskEither } from "fp-ts";
import React from "react";
import { demoize } from "../test/demoize";
import * as Test from "../test";
import { Overview, Todo } from "./todo";

demoize(
  "todo overview",
  () => {
    return <Overview />;
  },
  {
    api: {
      fetchTodos: () => taskEither.right([]),
    },
  },
);

demoize("todo", () => {
  return <Todo todo={Test.Data.Todo.buyIcecream} />;
});
