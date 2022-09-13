import * as Crypto from "crypto";
import { describe, it, expect } from "@jest/globals";
import { option, task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { firstValueFrom } from "rxjs";
import { ignore, throwException } from "utils";
import * as TestData from "../test-data";
import { Redis } from "../adapters";
import * as Event from "./event";

const withRepo = (
  fn: (
    connectResult: taskEither.TaskEither<string, Event.Repository>,
  ) => task.Task<void>,
  url = "redis://localhost:6379",
) =>
  pipe(
    Redis.connect({ url, namespace: Crypto.randomUUID() }),
    task.chainFirst(
      flow(
        taskEither.fromEither,
        taskEither.map((redis) => Event.create({ redis })),
        fn,
      ),
    ),
    taskEither.chain(Redis.disconnect),
  );

describe("event", () => {
  describe("addEvent", () => {
    it(
      "should add a domain event to the events stream",
      withRepo(
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
      "should return the full event including the domain event",
      withRepo(
        flow(
          taskEither.chain((client) =>
            client.addEvent(TestData.DomainEvent.createBuyIcecream),
          ),
          taskEither.match(throwException, ({ domainEvent }) =>
            expect(domainEvent).toEqual(TestData.DomainEvent.createBuyIcecream),
          ),
        ),
      ),
    );
  });

  describe("getEvents", () => {
    it(
      "should return an empty array if no events have been emitted",
      withRepo(
        flow(
          taskEither.chain((client) => client.getEvents(option.none)),
          taskEither.match(throwException, (events) =>
            expect(events).toHaveLength(0),
          ),
        ),
      ),
    );
  });

  describe("hasEventBeenLogged", () => {
    it.todo("should return whether an event has been logged");
  });

  describe("events$", () => {
    it(
      "should emit new events",
      withRepo(
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
                  domainEvent: TestData.DomainEvent.createBuyIcecream,
                }),
          ),
        ),
      ),
    );
  });
});
