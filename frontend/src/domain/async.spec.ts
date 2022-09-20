import { option } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Async from "./async";

describe("isPending", () => {
  it("should be true if result is none", () => {
    expect(
      Async.isPending({
        identifier: "foo",
        current: option.none,
      }),
    ).toBeTruthy();
  });

  it("should be true if result is some different id", () => {
    expect(
      Async.isPending({
        identifier: "foo",
        current: option.some({
          identifier: "bar",
          value: 0,
        }),
      }),
    ).toBeTruthy();
  });
});

describe("map", () => {
  it("should not change the identifiers", () => {
    const async = Async.of(0);
    const mapped = pipe(
      async,
      Async.map((value) => value + 1),
    );

    const pickIdentifier = ({ identifier }: { identifier: string }) =>
      identifier;

    expect(mapped.identifier).toEqual(async.identifier);
    expect(pipe(mapped.current, option.map(pickIdentifier))).toEqual(
      pipe(async.current, option.map(pickIdentifier)),
    );
  });
});
