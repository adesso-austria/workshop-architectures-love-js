import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Application from "../../application";
import { createMock } from "../utils";

export const create = (
  overrides: DeepPartial<Application.Todo.Application>,
): Application.Todo.Application =>
  mergeDeepRight(createMock<Application.Todo.Application>({}), overrides);
