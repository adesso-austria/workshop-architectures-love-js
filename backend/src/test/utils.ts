import { AnyRecord, DeepPartial } from "utils";

export const createMock = <T extends AnyRecord>(overrides: DeepPartial<T>) =>
  overrides as T;
