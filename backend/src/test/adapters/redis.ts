import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import { Redis } from "../../adapters";
import { createMock } from "../utils";

const adapter = createMock<Redis.Adapter>({});

export const create = (overrides: DeepPartial<Redis.Adapter>): Redis.Adapter =>
  mergeDeepRight(adapter, overrides);
