import { taskEither } from "fp-ts";
import React from "react";
import { demoize } from "../test/demoize";
import { Overview } from "./overview";

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
