import * as Crypto from "crypto";
import { describe, it, expect } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Rx from "rxjs";
import * as Redis from "./redis";

const withClient = (
  fn: (
    connectResult: taskEither.TaskEither<string, Redis.Adapter>,
  ) => task.Task<void>,
  url = "redis://localhost:6379",
) =>
  pipe(
    Redis.connect({ url, namespace: Crypto.randomUUID() }),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain((redis) => redis.close()),
  );

describe("connect", () => {
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

describe("buildKey", () => {
  it("should return just the key for empty prefix", () => {
    expect(Redis.buildKey("", "test")).toEqual("test");
  });
});

describe("streamAdd", () => {
  it(
    "should return the id of the message added",
    withClient(
      flow(
        taskEither.chain((client) => client.streamAdd("foo", { bar: "baz" })),
        taskEither.match(throwException, (id) => expect(id).toBeTruthy()),
      ),
    ),
  );
});

describe("streamSubscribe", () => {
  it(
    "should emit events since 0",
    withClient(
      flow(
        taskEither.chain((client) =>
          pipe(
            taskEither.Do,
            taskEither.apS("addedId", client.streamAdd("foo", { bar: "baz" })),
            taskEither.apS(
              "emitted",
              taskEither.tryCatch(
                () => Rx.firstValueFrom(client.streamSubscribe("foo", "0")),
                (reason) => reason as string,
              ),
            ),
          ),
        ),
        taskEither.match(throwException, ({ emitted }) => {
          expect(emitted.message).toEqual({ bar: "baz" });
        }),
      ),
    ),
  );
});

describe("streamRange", () => {
  it(
    "should return events between two ids",
    withClient(
      flow(
        taskEither.chain((client) =>
          pipe(
            taskEither.Do,
            taskEither.bind("first", () => client.streamAdd("foo", { a: "1" })),
            taskEither.bind("second", () =>
              client.streamAdd("foo", { a: "2" }),
            ),
            taskEither.bind("third", () => client.streamAdd("foo", { a: "3" })),
            taskEither.chain(({ first, third }) =>
              client.streamRange("foo", first, third),
            ),
          ),
        ),
        taskEither.match(throwException, (messages) => {
          const contents = messages.map(({ message }) => message);
          expect(contents).toContainEqual({ a: "1" });
          expect(contents).toContainEqual({ a: "2" });
          expect(contents).toContainEqual({ a: "3" });
        }),
      ),
    ),
  );
});
