import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";

export type Lazy<T> = {
  state: "settled" | "pending";
  current: option.Option<T>;
};

export const getOrElse =
  <T>(fallback: () => T) =>
  (lazy: Lazy<T>): T =>
    pipe(lazy.current, option.getOrElse(fallback));

export const pending = <T>(from?: Lazy<T>): Lazy<T> => ({
  state: "pending",
  current: from?.current ?? option.none,
});

export const of = <T>(value: T): Lazy<T> => ({
  state: "settled",
  current: option.some(value),
});

export const settle = <T>(lazy: Lazy<T>): Lazy<T> => ({
  ...lazy,
  state: "settled",
});

export const isPending = <T>(lazy: Lazy<T>): boolean =>
  lazy.state === "pending";

export const isSettled = <T>(lazy: Lazy<T>): boolean =>
  lazy.state === "settled";

export const map =
  <T, U>(fn: (value: T) => U) =>
  (lazy: Lazy<T>): Lazy<U> => ({
    ...lazy,
    current: pipe(lazy.current, option.map(fn)),
  });
