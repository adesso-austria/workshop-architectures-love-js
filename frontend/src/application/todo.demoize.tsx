import { option, taskEither } from "fp-ts";
import React from "react";
import { demoize } from "../test/demoize";
import { Overview } from "./todo";

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
