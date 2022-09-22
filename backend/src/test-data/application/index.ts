import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import { Application } from "../../application";
import * as Todo from "./todo";

export * as Todo from "./todo";

export const create = (overrides: DeepPartial<Application>): Application =>
  mergeDeepRight(
    {
      todo: Todo.create({}),
    },
    overrides,
  );
