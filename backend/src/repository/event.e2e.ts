import { describe, it, expect } from "@jest/globals";
import { option, task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { firstValueFrom } from "rxjs";
import { throwException } from "utils";
import * as TestData from "../test-data";
import * as Event from "./event";

const withRepo = (fn: (repository: Event.Repository) => task.Task<void>) =>
  TestData.Env.withAdapters(
    taskEither.fold(throwException, flow(Event.create, fn)),
  );

describe("event", () => {
  describe("addEvent", () => {
    it(
      "should add a domain event to the events stream",
      withRepo((client) =>
        pipe(
          client.addEvent(TestData.DomainEvent.createBuyIcecream),
          taskEither.chain(() => client.getEvents(option.none)),
          taskEither.match(throwException, (events) =>
            expect(events).toHaveLength(1),
          ),
        ),
      ),
    );

    it(
      "should return the full event including the domain event",
      withRepo((client) =>
        pipe(
          client.addEvent(TestData.DomainEvent.createBuyIcecream),
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
      withRepo((client) =>
        pipe(
          client.getEvents(option.none),
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

  describe("acknowledging events", () => {
    it(
      "should log the event id + consumer to the idempotency log",
      withRepo((repo) =>
        pipe(
          repo.acknowledgeEvent("foo", "bar"),
          taskEither.chain(() => repo.hasEventBeenAcknowledged("foo", "bar")),
          taskEither.match(throwException, (hasBeenAcknowledged) =>
            expect(hasBeenAcknowledged).toEqual(true),
          ),
        ),
      ),
    );
  });
});
