import * as Crypto from "crypto";
import { describe, it, expect } from "@jest/globals";
import { option, task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { firstValueFrom } from "rxjs";
import { ignore, throwException } from "utils";
import * as TestData from "../test-data";
import * as Redis from "./redis";

const withClient = (
  fn: (
    connectResult: taskEither.TaskEither<string, Redis.Client>,
  ) => task.Task<void>,
  url = "redis://localhost:6379",
) =>
  pipe(
    Redis.connect({ url, namespace: Crypto.randomUUID() }),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain((client) => client.disconnect()),
  );

describe("redis", () => {
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

  describe("addEvent", () => {
    it(
      "should add an event to the events stream",
      withClient(
        flow(
          taskEither.chain((client) =>
            pipe(
              client.addEvent(TestData.DomainEvent.createBuyIcecream),
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
          taskEither.chain((client) =>
            client.addEvent(TestData.DomainEvent.createBuyIcecream),
          ),
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

  describe("events$", () => {
    it(
      "should emit new events",
      withClient(
        flow(
          taskEither.map((client) => ({
            client,
            promise: firstValueFrom(client.events$),
          })),
          taskEither.chainFirst(({ client }) =>
            client.addEvent(TestData.DomainEvent.createBuyIcecream),
          ),
          taskEither.fold(
            throwException,
            ({ promise }) =>
              () =>
                expect(promise).resolves.toMatchObject({
                  message: TestData.DomainEvent.createBuyIcecream,
                }),
          ),
        ),
      ),
    );
  });
});
