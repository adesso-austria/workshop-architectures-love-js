import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import { Env } from "../application/env";
import { Event, Todo } from "./repository";

export const defaultEnv: Env = {
  repositories: { event: Event.repository, todo: Todo.repository },
};

export const create = (overrides: DeepPartial<Env>): Env =>
  mergeDeepRight(defaultEnv, overrides);
