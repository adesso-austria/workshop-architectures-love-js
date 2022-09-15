import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Mongo from "./mongo";
import * as Redis from "./redis";

export const adapters = {
  mongo: Mongo.adapter,
  redis: Redis.adapter,
};

export const create = (
  overrides: DeepPartial<typeof adapters>,
): typeof adapters => mergeDeepRight(adapters, overrides);

export * as Mongo from "./mongo";
export * as Redis from "./redis";
