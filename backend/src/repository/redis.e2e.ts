import { describe, it } from "@jest/globals";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Redis from "./redis";

const connect = (url?: string) =>
  Redis.connect({ ...(url == null ? {} : { url }), db: 1 });

describe("redis", () => {
  describe("connect", () => {
    it(
      "should return left if invalid connection url is given",
      pipe(connect("uynptrs"), taskEither.match(ignore, throwException))
    );

    it(
      "should return a right if a valid url is given",
      pipe(connect(), taskEither.match(throwException, ignore))
    );
  });

  describe("flush", () => {
    it(
      "should reject if selected db is 0 (prod)",
      pipe(
        Redis.connect(),
        taskEither.chain((client) => client.flush()),
        taskEither.match(ignore, () =>
          throwException("should not have dropped prod db")
        )
      )
    );
  });
});
