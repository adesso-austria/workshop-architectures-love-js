import { describe, it, expect, jest } from "@jest/globals";
import { either, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { mergeDeepRight } from "ramda";
import { Jest } from "test-utils";
import { DeepPartial } from "utils";
import * as Rx from "rxjs";
import * as Adapters from "../adapters";
import * as TestData from "../test-data";
import * as Event from "./event";

const create = (opts: DeepPartial<Event.CreateOpts>): Event.Repository =>
  Event.create(
    mergeDeepRight(
      {
        redis: TestData.Adapters.Redis.create({}),
        mongo: TestData.Adapters.Mongo.create({}),
      },
      opts,
    ),
  );

describe("addEvent", () => {
  it("should add a domain event to the events stream", async () => {
    const streamAdd = jest.fn(() => taskEither.right("foo"));
    const repo = create({
      redis: {
        streamAdd,
      },
    });

    const task = repo.addEvent(TestData.DomainEvent.createBuyIcecream);
    await task();

    expect(streamAdd).toHaveBeenCalledWith(
      Event.eventsKey,
      Event.stringifyDomainEvent(TestData.DomainEvent.createBuyIcecream),
    );
  });

  it("should return the full event including the domain event", async () => {
    const repo = create({
      redis: {
        streamAdd: () => taskEither.right("foo"),
      },
    });

    const task = repo.addEvent(TestData.DomainEvent.createBuyIcecream);
    const result = await task();

    expect(result).toEqual(
      either.right({
        domainEvent: TestData.DomainEvent.createBuyIcecream,
        id: "foo",
      }),
    );
  });
});

describe("getEvents", () => {
  it("should call streamRange with maximum range if no id has been passed", async () => {
    const streamRange = jest.fn(() => taskEither.right([]));
    const repo = create({
      redis: {
        streamRange,
      },
    });

    const task = repo.getEvents(option.none);
    await task();

    expect(streamRange).toHaveBeenCalledWith(Event.eventsKey, "-", "+");
  });

  it("should call streamRange with range ]from, +] if from has been passed", async () => {
    const streamRange = jest.fn(() => taskEither.right([]));
    const repo = create({
      redis: {
        streamRange,
      },
    });

    const task = repo.getEvents(option.some("foo"));
    await task();

    expect(streamRange).toHaveBeenCalledWith(Event.eventsKey, "(foo", "+");
  });

  it("should map responses to events", async () => {
    const streamRange = jest.fn(() =>
      taskEither.right([
        {
          id: TestData.Event.createBuyIcecream.id,
          message: Event.stringifyDomainEvent(
            TestData.DomainEvent.createBuyIcecream,
          ),
        },
      ]),
    );
    const repo = create({
      redis: {
        streamRange,
      },
    });

    const task = repo.getEvents(option.none);
    const result = await task();

    expect(result).toEqual(either.right([TestData.Event.createBuyIcecream]));
  });
});

describe("eventStream", () => {
  it("should subscribe to all events since the latest known id", async () => {
    const streamSubscribe = jest.fn(() => Rx.of());
    const repo = create({
      mongo: {
        findLast: (() =>
          taskEither.right(
            option.some({ consumer: "foo", id: "bar" }),
          )) as Adapters.Mongo.Adapter["findLast"],
      },
      redis: {
        streamSubscribe,
      },
    });

    const task = repo.eventStream;
    await task();
    expect(streamSubscribe).toHaveBeenCalledWith(Event.eventsKey, "bar");
  });

  it("should parse the emitted messages", async () => {
    const repo = create({
      redis: {
        streamSubscribe: () =>
          Rx.of<Adapters.Redis.Message>({
            id: "foo",
            message: Event.stringifyDomainEvent(
              TestData.DomainEvent.createBuyIcecream,
            ),
          }),
      },
    });

    const task = pipe(
      repo.eventStream,
      taskEither.chain(
        (stream) => () =>
          Rx.firstValueFrom(stream).then((value) =>
            either.right<string, typeof value>(value),
          ),
      ),
      taskEither.map((event) => event.domainEvent),
    );
    const result = await task();
    expect(result).toEqual(
      either.right(TestData.DomainEvent.createBuyIcecream),
    );
  });
});

Jest.testGivenThen<option.Option<{ consumer: string; id: string }>, boolean>(
  "hasEventBeenLogged",
  async (givenAdapterResponse, expectHasBeenAcknowledged) => {
    const repo = create({
      mongo: {
        findOne: (() =>
          taskEither.right(
            givenAdapterResponse,
          )) as Adapters.Mongo.Adapter["findOne"],
      },
    });

    const result = await repo.hasEventBeenAcknowledged("foo", "bar")();
    expect(result).toEqual(either.right(expectHasBeenAcknowledged));
  },
  [
    Jest.givenThen(
      "should return true if event has been acknowledged",
      option.some({ consumer: "foo", id: "bar" }),
      true,
    ),
    Jest.givenThen(
      "should return false if event hasn't been acknowledged",
      option.none,
      false,
    ),
  ],
);

describe("acknowledging events", () => {
  it("should log the event id + consumer to the idempotency log", async () => {
    const addOne = jest.fn(() => taskEither.right(undefined));
    const repo = create({
      mongo: {
        addOne,
      },
    });

    const task = repo.acknowledgeEvent("foo", "bar");
    await task();

    expect(addOne).toHaveBeenCalledWith(Event.ackEventsKey, {
      consumer: "foo",
      eventId: "bar",
    });
  });
});
