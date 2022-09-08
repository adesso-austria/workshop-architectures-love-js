import * as Crypto from "crypto";
import { describe, it, expect } from "@jest/globals";
import { either, ioEither, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import { connect, ErrorCode } from "./mongo";

const cleanConnect = (url: string) =>
  pipe(
    connect(url, "testdb"),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.map(() => client)
      )
    )
  );

describe("mongo", () => {
  const defaultUrl = "mongodb://localhost:27017";

  it(
    "should return left if no url is given",
    pipe(
      connect(),
      taskEither.match(ignore, () => throwException("expected a left"))
    )
  );

  it(
    "should return left ECREATE when given an invalid url",
    pipe(
      connect("foo"),
      taskEither.match(ignore, () => throwException("expected a left"))
    )
  );

  it(
    "should return right when connection to db succeeds",
    pipe(
      connect(defaultUrl),
      taskEither.match(() => throwException("expected a right"), ignore)
    )
  );

  describe("getLastKnownEventId", () => {
    it(
      "should return left ENOTFOUND if the db is empty",
      pipe(
        connect(defaultUrl, Crypto.randomUUID()),
        taskEither.chain(({ getLastKnownEventId }) => getLastKnownEventId()),
        taskEither.match(ignore, () => throwException("expected a left"))
      )
    );

    it("should return right if key was found", async () => {
      const task = pipe(
        connect(defaultUrl, Crypto.randomUUID()),
        taskEither.chain((client) =>
          pipe(
            client.setLastKnownEventId("bla"),
            taskEither.chain(() => client.getLastKnownEventId())
          )
        )
      );
      expect(await task()).toEqual(either.right("bla"));
    });
  });

  describe("setLastKnownEventId", () => {
    it(
      "should return right",
      pipe(
        cleanConnect(defaultUrl),
        taskEither.chain((client) =>
          pipe(
            client.setLastKnownEventId("foo"),
            taskEither.chain(() => client.getLastKnownEventId())
          )
        ),
        taskEither.match(
          () => throwException("expected a right"),
          (id) => expect(id).toEqual("foo")
        )
      )
    );
  });
});
