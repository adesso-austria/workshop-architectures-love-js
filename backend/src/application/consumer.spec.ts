import * as Crypto from "crypto";
import { it, expect, jest } from "@jest/globals";
import { taskEither } from "fp-ts";
import * as Rx from "rxjs";
import * as TestData from "../test-data";
import * as Consumer from "./consumer";

it("should fetch unknown events first", async () => {
  const consumerFn = jest.fn(() => taskEither.right<string, void>(undefined));
  const env = TestData.Env.create({
    repositories: {
      event: {
        getUnknownEvents: () =>
          taskEither.right([TestData.Event.createBuyIcecream]),
        eventStream: taskEither.right(Rx.of(TestData.Event.createBuyMilk)),
      },
    },
  });

  await Rx.lastValueFrom(Consumer.create(env, Crypto.randomUUID(), consumerFn));

  expect(consumerFn).toHaveBeenNthCalledWith(
    1,
    TestData.DomainEvent.createBuyIcecream,
  );

  expect(consumerFn).toHaveBeenNthCalledWith(
    2,
    TestData.DomainEvent.createBuyMilk,
  );
});

it("should rectify eventual overlaps between eventstream and unknown events", async () => {
  const consumerFn = jest.fn(() => taskEither.right<string, void>(undefined));
  const acknowledgedEvents = new Set<string>();
  const env = TestData.Env.create({
    repositories: {
      event: {
        acknowledgeEvent: (_consumer, id) => {
          acknowledgedEvents.add(id);
          return taskEither.right(undefined);
        },
        hasEventBeenAcknowledged: (_consumer, id) =>
          taskEither.right(acknowledgedEvents.has(id)),
        getUnknownEvents: () =>
          taskEither.right([TestData.Event.createBuyIcecream]),
        eventStream: taskEither.right(Rx.of(TestData.Event.createBuyIcecream)),
      },
    },
  });

  await Rx.lastValueFrom(Consumer.create(env, Crypto.randomUUID(), consumerFn));

  expect(consumerFn).toHaveBeenCalledTimes(1);
});

it("should not execute the given fn if an event has been acknowledged", async () => {
  const consumerFn = jest.fn(() => taskEither.right<string, void>(undefined));
  const env = TestData.Env.create({
    repositories: {
      event: {
        hasEventBeenAcknowledged: () => taskEither.right(true),
        eventStream: taskEither.right(Rx.of(TestData.Event.createBuyIcecream)),
      },
    },
  });

  await Rx.firstValueFrom(
    Consumer.create(env, Crypto.randomUUID(), consumerFn),
  );

  expect(consumerFn).toHaveBeenCalledTimes(0);
});

it("should acknowledge the event if it is still unknown", async () => {
  const acknowledgeEvent = jest.fn(() => taskEither.right(undefined));
  const env = TestData.Env.create({
    repositories: {
      event: {
        hasEventBeenAcknowledged: () => taskEither.right(false),
        acknowledgeEvent,
        eventStream: taskEither.right(Rx.of(TestData.Event.createBuyIcecream)),
      },
    },
  });
  const consumerId = Crypto.randomUUID();
  await Rx.firstValueFrom(
    Consumer.create(env, consumerId, () => taskEither.right(undefined)),
  );

  expect(acknowledgeEvent).toHaveBeenCalledWith(
    consumerId,
    TestData.Event.createBuyIcecream.id,
  );
});

it("should not acknowledge the event if the fn fails", async () => {
  const acknowledgeEvent = jest.fn(() => taskEither.right(undefined));
  const env = TestData.Env.create({
    repositories: {
      event: {
        hasEventBeenAcknowledged: () => taskEither.right(false),
        acknowledgeEvent,
        eventStream: taskEither.right(Rx.of(TestData.Event.createBuyIcecream)),
      },
    },
  });

  await Rx.firstValueFrom(
    Consumer.create(env, Crypto.randomUUID(), () =>
      taskEither.left("some error"),
    ),
  );

  expect(acknowledgeEvent).toHaveBeenCalledTimes(0);
});

it("should not be possible to create another consumer with the same name in the same env", async () => {
  const env = TestData.Env.create({});
  Consumer.create(env, "foo", () => taskEither.right(undefined));
  expect(() =>
    Consumer.create(env, "foo", () => taskEither.right(undefined)),
  ).toThrow();
});
