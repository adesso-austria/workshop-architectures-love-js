import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Rx from "rxjs";
import { Application } from "../../application/todo";
import { mocked } from "../utils";

export const create = (overrides: DeepPartial<Application>): Application =>
  mergeDeepRight(
    {
      getTodos: mocked,
      getTodo: mocked,
      addTodo: mocked,
      consumer: Rx.of(),
    },
    overrides,
  );
