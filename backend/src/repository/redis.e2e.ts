import { describe, it, expect } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Redis from "./redis";

const connect = (url?: string) =>
  pipe(
    Redis.connect({ ...(url == null ? {} : { url }), db: 1 }),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.map(() => client)
      )
    )
  );

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

  describe("addEvent", () => {
    it(
      "should add an event to the events stream",
      pipe(
        connect(),
        taskEither.chain((client) =>
          pipe(
            client.addEvent({ foo: "bar" }),
            taskEither.chain(() => client.getEvents(option.none))
          )
        ),
        taskEither.match(throwException, (events) =>
          expect(events).toHaveLength(1)
        )
      )
    );

    it(
      "should return the event id of the added event",
      pipe(
        connect(),
        taskEither.chain((client) => client.addEvent({ foo: "bar" })),
        taskEither.match(throwException, (id) =>
          expect(typeof id === "string").toBeTruthy()
        )
      )
    );
  });

  describe("getEvents", () => {
    it(
      "should return an empty array if no events have been emitted",
      pipe(
        connect(),
        taskEither.chain((client) => client.getEvents(option.none)),
        taskEither.match(throwException, (events) =>
          expect(events).toHaveLength(0)
        )
      )
    );
  });
});
