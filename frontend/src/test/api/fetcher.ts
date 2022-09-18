import { mergeDeepRight } from "ramda";
import { DeepPartial, throwException } from "utils";
import { Fetcher } from "../../api/fetcher";

const defaultFetcher: Fetcher = {
  getTodo: () => throwException("not implemented"),
  postTodo: () => throwException("not implemented"),
  getTodos: () => throwException("not implemented"),
  getTodoContent: () => throwException("not implemented"),
};

export const create = (overrides: DeepPartial<Fetcher>): Fetcher =>
  mergeDeepRight(defaultFetcher, overrides);
