import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Async from "./async";

describe("isPending", () => {
  it("should return true if the task is pending", () => {
    expect(
      pipe(Async.of(0, { foo: { state: "pending" } }), Async.isPending("foo")),
    ).toEqual(true);
  });

  it("should return false if the task is resolved", () => {
    expect(
      pipe(Async.of(0, { foo: { state: "resolved" } }), Async.isPending("foo")),
    ).toEqual(false);
  });

  it("should return false if the task is rejected", () => {
    expect(
      pipe(
        Async.of(0, { foo: { state: "rejected", error: "bar" } }),
        Async.isPending("foo"),
      ),
    ).toEqual(false);
  });
});

describe("isAnyPending", () => {
  it("should return true if at least one task is pending", () => {
    expect(
      pipe(
        Async.of(0, { foo: { state: "pending" }, bar: { state: "resolved" } }),
        Async.isAnyPending,
      ),
    ).toEqual(true);
  });

  it("should return false if no task is pending", () => {
    expect(pipe(Async.of(0), Async.isAnyPending)).toEqual(false);
  });
});

describe("isSettled", () => {
  it("should return true if a task is resolved", () => {
    expect(
      pipe(Async.of(0, { foo: { state: "resolved" } }), Async.isSettled("foo")),
    ).toEqual(true);
  });

  it("should return true if a task is rejected", () => {
    expect(
      pipe(
        Async.of(0, { foo: { state: "rejected", error: "message" } }),
        Async.isSettled("foo"),
      ),
    ).toEqual(true);
  });

  it("should return true if no tasks are given", () => {
    expect(pipe(Async.of(0), Async.isSettled("foo"))).toEqual(true);
  });
});

describe("areAllSettled", () => {
  it("should return true if all tasks are resolved or rejected", () => {
    expect(
      pipe(
        Async.of(0, {
          foo: { state: "rejected", error: "message" },
          bar: { state: "resolved" },
        }),
        Async.areAllSettled,
      ),
    ).toEqual(true);
  });
});

describe("chain", () => {
  it("should be possible to use the current value to map to a new async", () => {
    expect(
      pipe(
        Async.of(0, { foo: { state: "pending" } }),
        Async.chain((value) =>
          Async.of(value + 1, { foo: { state: "resolved" } }),
        ),
        Async.isPending("foo"),
      ),
    ).toEqual(false);
  });
});

describe("getError", () => {
  it("should return none if task isn't in an error state", () => {
    expect(
      pipe(Async.of(0, { foo: { state: "resolved" } }), Async.getError("foo")),
    ).toEqual(option.none);
  });

  it("should return some error if task is in an error state", () => {
    expect(
      pipe(
        Async.of(0, { foo: { state: "rejected", error: "some error" } }),
        Async.getError("foo"),
      ),
    ).toEqual(option.some("some error"));
  });
});
