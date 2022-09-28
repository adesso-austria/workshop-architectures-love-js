import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Mongo from "./mongo";
import * as Redis from "./redis";

const adapters = {
  mongo: Mongo.create({}),
  redis: Redis.create({}),
};

export const create = (
  overrides: DeepPartial<typeof adapters>,
): typeof adapters => mergeDeepRight(adapters, overrides);

export * as Mongo from "./mongo";
export * as Redis from "./redis";
