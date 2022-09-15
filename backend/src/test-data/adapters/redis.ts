import { mergeDeepRight } from "ramda";
import { DeepPartial, throwIfCalled } from "utils";
import { Redis } from "../../adapters";

const mocked = throwIfCalled("not sensible to call on mock");

export const adapter: Redis.Adapter = {
  streamAdd: mocked,
  streamSubscribe: mocked,
  streamRange: mocked,
  close: mocked,
};

export const create = (overrides: DeepPartial<Redis.Adapter>): Redis.Adapter =>
  mergeDeepRight(adapter, overrides);
