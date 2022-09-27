import { mergeDeepRight } from "ramda";
import { DeepPartial, throwException } from "utils";
import * as Fetcher from "../../api/fetcher";

const defaultFetcher: Fetcher.Fetcher = {
  getTodo: () => throwException("not implemented"),
  postTodo: () => throwException("not implemented"),
  getTodos: () => throwException("not implemented"),
  getTodoContent: () => throwException("not implemented"),
  deleteTodo: () => throwException("not implemented"),
  putTodo: () => throwException("not implemented"),
};

export const create = (
  overrides: DeepPartial<Fetcher.Fetcher>,
): Fetcher.Fetcher => mergeDeepRight(defaultFetcher, overrides);

export namespace Response {
  export const status = <Status extends number, T>(
    status: Status,
    data: T,
  ): Fetcher.Response<Status, T> => {
    const isOk = status >= 200 && status < 300;
    return {
      headers: new Headers(),
      ok: isOk,
      status,
      statusText: isOk ? "ok" : "not ok",
      data,
    };
  };

  export const ok = <T>(data: T) => status(200, data);
}
