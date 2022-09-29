import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import { Redis } from "../../adapter";
import { createMock } from "../utils";

const adapter = createMock<Redis.Adapter>({});

export const create = (overrides: DeepPartial<Redis.Adapter>): Redis.Adapter =>
  mergeDeepRight(adapter, overrides);
