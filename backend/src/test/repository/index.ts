import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import { Repository } from "../../repository";

import * as Event from "./event";
import * as Todo from "./todo";

export * as Event from "./event";
export * as Todo from "./todo";

export const create = (overrides: DeepPartial<Repository>): Repository =>
  mergeDeepRight(
    {
      event: Event.create({}),
      todo: Todo.create({}),
    },
    overrides,
  );
