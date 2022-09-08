import { describe, it } from "@jest/globals";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestUtils from "../test-utils";

describe("db", () => {
  describe("connect", () => {
    it(
      "should return left if given an invalid mongo url",
      pipe(
        TestUtils.Repository.connect({ db: { mongo: { url: "fuytnrt" } } }),
        taskEither.match(ignore, () => throwException("expected a left"))
      )
    );
  });
});
