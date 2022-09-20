import { mergeDeepRight } from "ramda";
import { DeepPartial, throwException } from "utils";
import * as Api from "../../api";

export const create = (overrides: DeepPartial<Api.Api>): Api.Api => {
  return mergeDeepRight(
    Api.create(
      Api.Fetcher.create(() => throwException("tried to fetch in tests")),
    ),
    overrides,
  );
};
