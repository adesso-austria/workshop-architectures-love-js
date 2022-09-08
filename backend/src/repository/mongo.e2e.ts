import { describe, it, expect } from "@jest/globals";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestUtils from "../test-utils";
import * as Mongo from "./mongo";

const connect = (url?: string) =>
  Mongo.connect({ ...(url == null ? {} : { url }), db: "test-db" });

describe("mongo", () => {
  describe("connect", () => {
    it(
      "should return left when given an invalid url",
      pipe(connect("foo"), taskEither.match(ignore, throwException))
    );

    it(
      "should return right when connection to db succeeds",
      pipe(
        TestUtils.Repository.connect(),
        taskEither.match(throwException, ignore)
      )
    );
  });

  describe("flush", () => {
    it(
      "should completely drop the db",
      pipe(
        connect(),
        taskEither.chain((client) =>
          pipe(
            client.flush(),
            taskEither.chain(() =>
              taskEither.tryCatch(
                () => client.db.collections(),
                () => "could not list collections"
              )
            )
          )
        ),
        taskEither.match(throwException, (collections) =>
          expect(collections).toHaveLength(0)
        )
      )
    );
  });
});
