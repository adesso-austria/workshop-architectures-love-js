import { describe, it, expect } from "@jest/globals";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import { connect } from "./redis";

const connectClean = (url: string) =>
  pipe(
    connect({ url, db: 1 }),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.map(() => client)
      )
    )
  );

describe("redis", () => {
  const defaultUrl = "redis://localhost:6379";

  it(
    "should return left if invalid connection url is given",
    pipe(
      connectClean("fuytnwrt"),
      taskEither.match(ignore, () => throwException("expected a left"))
    )
  );

  it(
    "should return a right if a valid url is given",
    pipe(
      connectClean(defaultUrl),
      taskEither.match(() => throwException("expected a right"), ignore)
    )
  );

  describe("getLastEventId", () => {
    it(
      "should return the last event id",
      pipe(
        connectClean(defaultUrl),
        taskEither.chain((client) =>
          pipe(
            client.emit({ foo: "bar" }),
            taskEither.chain(() => client.getLastEventId())
          )
        ),
        taskEither.match(throwException, (id) => expect(id).toBeDefined())
      )
    );

    it(
      "should return undefined if no events exist",
      pipe(
        connectClean(defaultUrl),
        taskEither.chain((client) => client.getLastEventId()),
        taskEither.match(
          () => throwException("expected a right"),
          (id) => expect(id).toBeUndefined()
        )
      )
    );
  });
});
