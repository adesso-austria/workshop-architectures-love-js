import { option, taskEither } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Mongo from "../../adapters/mongo";
import { mocked } from "../utils";

const adapter: Mongo.Adapter = {
  addOne: mocked,
  findOne: mocked,
  findAll: () => taskEither.right([]),
  findLast: () => taskEither.right(option.none),
  updateOne: mocked,
  deleteOne: mocked,
  close: mocked,
};

export const create = (overrides: DeepPartial<Mongo.Adapter>): Mongo.Adapter =>
  mergeDeepRight(adapter, overrides);
