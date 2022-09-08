import * as Contracts from "contracts";
import { taskEither } from "fp-ts";

export type Response<Status, T> = {
  readonly headers: Headers;
  readonly url: string;
  readonly ok: boolean;
  readonly statusText: string;
  readonly status: Status;
  readonly data: T;
};

type Endpoint<
  Path extends keyof Contracts.paths = keyof Contracts.paths,
  Method extends keyof Contracts.paths[Path] = keyof Contracts.paths[Path]
> = `${Uppercase<Extract<Method, string>>} ${Path}`;

type Endpoints = {
  [path in keyof Contracts.paths as Endpoint<
    path,
    keyof Contracts.paths[path]
  >]: unknown;
};

type Op<
  Path extends keyof Contracts.paths,
  Method extends keyof Contracts.paths[Path]
> = (
  parameters: Contracts.paths[Path][Method] extends {
    parameters: infer Parameters;
  }
    ? Parameters
    : unknown
) => Contracts.paths[Path][Method] extends {
  responses: infer Responses;
}
  ? taskEither.TaskEither<
      string,
      {
        [status in keyof Responses]: Response<
          status,
          Responses[status] extends {
            content: infer Content;
          }
            ? Content extends { "application/json": infer JsonContent }
              ? JsonContent
              : Content extends { "text/plain": unknown }
              ? string
              : unknown
            : unknown
        >;
      }[keyof Responses]
    >
  : unknown;

export type Fetcher = {
  [endpoint in keyof Endpoints as endpoint extends `${infer Method} ${infer Path}`
    ? Path extends `/${infer P}`
      ? `${Lowercase<Method>}${Capitalize<P>}`
      : never
    : never]: endpoint extends `${infer method} ${infer path}`
    ? path extends keyof Contracts.paths
      ? Lowercase<method> extends keyof Contracts.paths[path]
        ? Op<path, Lowercase<method>>
        : unknown
      : unknown
    : unknown;
};

export const buildQueryString = (
  query: Record<string, string | string[]>
): string => {
  const args = Object.entries(query).reduce((args, [key, value]) => {
    args.push(`${key}=${Array.isArray(value) ? value.join(",") : value}`);
    return args;
  }, [] as string[]);
  return args.length === 0 ? "" : `?${args.join("&")}`;
};

export const create = (fetch = globalThis.fetch): Fetcher => {
  /**
   * create an operation for the given endpoint * method
   */
  const createOp = <
    Path extends keyof Contracts.paths,
    Method extends keyof Contracts.paths[Path]
  >(
    path: Path,
    method: Method
  ) => {
    // type gets a bit too complicated here...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((args: any) =>
      taskEither.tryCatch(
        () =>
          fetch(
            `${path}${
              "query" in args ? `?${buildQueryString(args.query)}` : ""
            }`,
            {
              body: args.body,
              headers: args.headers,
              method: method as string,
            }
          ).then((res) => res.json().catch(() => res.text())),
        () => "could not fetch"
      )) as Op<Path, Method>;
  };

  return {
    getTodo: createOp("/todo", "get"),
    getTodos: createOp("/todos", "get"),
    postTodo: createOp("/todo", "post"),
    getTodoContent: createOp("/todoContent", "get"),
  };
};
