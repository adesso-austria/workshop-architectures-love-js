import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import { Env } from "../application/env";
import { todo } from "./repository";

export const defaultEnv: Env = { repositories: { todo } };

export const create = (overrides: DeepPartial<Env>): Env =>
  mergeDeepRight(defaultEnv, overrides);
