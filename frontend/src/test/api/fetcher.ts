import { mergeDeepRight } from "ramda";
import { DeepPartial, throwException } from "utils";
import * as Fetcher from "../../api/fetcher";

const defaultFetcher: Fetcher.Fetcher = {
  getTodo: () => throwException("not implemented"),
  postTodo: () => throwException("not implemented"),
  getTodos: () => throwException("not implemented"),
  getTodoContent: () => throwException("not implemented"),
};

export const create = (
  overrides: DeepPartial<Fetcher.Fetcher>,
): Fetcher.Fetcher => mergeDeepRight(defaultFetcher, overrides);

export namespace Response {
  export const ok = <T>(data: T): Fetcher.Response<200, T> => ({
    headers: new Headers(),
    ok: true,
    status: 200,
    statusText: "ok",
    data,
  });
}
