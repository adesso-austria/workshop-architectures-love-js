import { describe, it, expect } from "@jest/globals";
import { option, task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Redis from "./redis";

const withClient = (
  fn: (
    connectResult: taskEither.TaskEither<string, Redis.Client>
  ) => task.Task<void>,
  url?: string,
) =>
  pipe(
    Redis.connect({ ...(url == null ? {} : { url }), db: 1 }),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.map(() => client),
      ),
    ),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.chain(() => client.disconnect()),
      ),
    ),
  );

describe("redis", () => {
  describe("connect", () => {
    it("should return left if no url is given", async () => {
      const url = process.env["REDIS_URL"];
      delete process.env["REDIS_URL"];
      const task = withClient(
        taskEither.match(ignore, () => throwException("expected a left")),
      );
      await task();
      process.env["REDIS_URL"] = url;
    });

    it(
      "should return left if invalid connection url is given",
      withClient(
        taskEither.match(ignore, () => throwException("expected a left")),
        "uyfntw",
      ),
    );

    it(
      "should return a right if a valid url is given",
      withClient(taskEither.match(throwException, ignore)),
    );
  });

  describe("flush", () => {
    it(
      "should reject if selected db is 0 (prod)",
      pipe(
        Redis.connect(),
        taskEither.chain((client) =>
          pipe(client.flush(), taskEither.apFirst(client.disconnect())),
        ),
        taskEither.match(ignore, () =>
          throwException("should not have dropped prod db"),
        ),
      ),
    );
  });

  describe("addEvent", () => {
    it(
      "should add an event to the events stream",
      withClient(
        flow(
          taskEither.chain((client) =>
            pipe(
              client.addEvent({ foo: "bar" }),
              taskEither.chain(() => client.getEvents(option.none)),
            ),
          ),
          taskEither.match(throwException, (events) =>
            expect(events).toHaveLength(1),
          ),
        ),
      ),
    );

    it(
      "should return the event id of the added event",
      withClient(
        flow(
          taskEither.chain((client) => client.addEvent({ foo: "bar" })),
          taskEither.match(throwException, (id) =>
            expect(typeof id === "string").toBeTruthy(),
          ),
        ),
      ),
    );
  });

  describe("getEvents", () => {
    it(
      "should return an empty array if no events have been emitted",
      withClient(
        flow(
          taskEither.chain((client) => client.getEvents(option.none)),
          taskEither.match(throwException, (events) =>
            expect(events).toHaveLength(0),
          ),
        ),
      ),
    );
  });
});
