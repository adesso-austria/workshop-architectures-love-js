import { either } from "fp-ts";
import { flow } from "fp-ts/lib/function";
import * as Pattern from "ts-pattern";

export type Result<T> = either.Either<string, T>;
export type Lazy<T> =
  | { type: "settled"; result: Result<T> }
  | { type: "pending" };

export const pending = <T>(): Lazy<T> => ({ type: "pending" });

export const of = <T>(result: Result<T>): Lazy<T> => ({
  type: "settled",
  result,
});

export const success = <T>(value: T): Lazy<T> => ({
  type: "settled",
  result: either.right(value),
});

export const error = <T>(error: string): Lazy<T> => ({
  type: "settled",
  result: either.left(error),
});

export const match =
  <T, U>(
    onPending: () => U,
    onError: (error: string) => U,
    onSuccess: (value: T) => U,
  ) =>
  (lazy: Lazy<T>) =>
    Pattern.match(lazy)
      .with({ type: "pending" }, onPending)
      .with(
        { type: "settled", result: Pattern.P.select() },
        flow(either.match(onError, onSuccess)),
      )
      .exhaustive();
