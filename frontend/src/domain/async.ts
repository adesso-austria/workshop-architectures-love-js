import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";

export type Async<T> = {
  identifier: string;
  current: option.Option<{ identifier: string; value: T }>;
};

export const isPending = <T>(async: Async<T>) =>
  pipe(
    async.current,
    option.map(({ identifier }) => identifier !== async.identifier),
    option.getOrElse(() => false),
  );

/**
 * inverse to isPending
 */
export const isSettled = <T>(async: Async<T>) =>
  pipe(async, isPending, (result) => !result);

export const pending = <T>(from?: Async<T>): Async<T> => ({
  identifier: "randomUUID",
  current: from?.current ?? option.none,
});

export const of = <T>(value: T): Async<T> => {
  const identifier = "randomUUID";
  return {
    identifier,
    current: option.some({ identifier, value }),
  };
};

export const getOrElse =
  <T>(fallback: () => T) =>
  (async: Async<T>): T =>
    pipe(
      async.current,
      option.map(({ value }) => value),
      option.getOrElse(fallback),
    );

export const map =
  <T, U>(fn: (current: T) => U) =>
  (async: Async<T>): Async<U> => ({
    ...async,
    current: pipe(
      async.current,
      option.map((current) => ({
        ...current,
        value: fn(current.value),
      })),
    ),
  });
