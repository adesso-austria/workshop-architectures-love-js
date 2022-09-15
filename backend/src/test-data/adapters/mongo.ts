import { mergeDeepRight } from "ramda";
import { DeepPartial, throwIfCalled } from "utils";
import { Mongo } from "../../adapters";

const mocked = throwIfCalled("not sensible to call on mock");

export const adapter: Mongo.Adapter = {
  addOne: mocked,
  findOne: mocked,
  updateOne: mocked,
  deleteOne: mocked,
  close: mocked,
};

export const create = (overrides: DeepPartial<Mongo.Adapter>): Mongo.Adapter =>
  mergeDeepRight(adapter, overrides);
