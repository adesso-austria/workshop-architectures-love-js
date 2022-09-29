import { option, taskEither } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Adapters from "../../adapter";
import { createMock } from "../utils";

const adapter = createMock<Adapters.Mongo.Adapter>({
  findAll: () => taskEither.right([]),
  findLast: () => taskEither.right(option.none),
});

export const create = (
  overrides: DeepPartial<Adapters.Mongo.Adapter>,
): Adapters.Mongo.Adapter => mergeDeepRight(adapter, overrides);
