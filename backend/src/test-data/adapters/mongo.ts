import { option, taskEither } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Mongo from "../../adapters/mongo";
import { createMock } from "../utils";

const adapter = createMock<Mongo.Adapter>({
  findAll: () => taskEither.right([]),
  findLast: () => taskEither.right(option.none),
});

export const create = (overrides: DeepPartial<Mongo.Adapter>): Mongo.Adapter =>
  mergeDeepRight(adapter, overrides);
