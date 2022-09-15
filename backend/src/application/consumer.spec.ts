import * as Crypto from "crypto";
import { it, expect, jest } from "@jest/globals";
import { either, task, taskEither } from "fp-ts";
import * as Rx from "rxjs";
import { pipe } from "fp-ts/lib/function";
import { throwException } from "utils";
import * as TestData from "../test-data";
import * as Consumer from "./consumer";

const awaitFirstProcessed = (consumer: Consumer.Consumer) =>
  pipe(
    consumer,
    task.chain(
      (resultStream) => () =>
        pipe(
          resultStream,
          either.match(throwException, (stream) => Rx.firstValueFrom(stream)),
        ),
    ),
  )();

const awaitLastProcessed = (consumer: Consumer.Consumer) =>
  pipe(
    consumer,
    task.chain(
      (resultStream) => () =>
        pipe(
          resultStream,
          either.match(throwException, (stream) => Rx.lastValueFrom(stream)),
        ),
    ),
  )();

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

  await awaitLastProcessed(
    Consumer.create(env, Crypto.randomUUID(), consumerFn),
  );

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

  await awaitLastProcessed(
    Consumer.create(env, Crypto.randomUUID(), consumerFn),
  );

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

  await awaitFirstProcessed(
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
  await awaitFirstProcessed(
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

  await awaitFirstProcessed(
    Consumer.create(env, Crypto.randomUUID(), () =>
      taskEither.left("some error"),
    ),
  );

  expect(acknowledgeEvent).toHaveBeenCalledTimes(0);
});

it("should not be possible to create another consumer with the same name", async () => {
  Consumer.create(TestData.Env.defaultEnv, "foo", () =>
    taskEither.right(undefined),
  );
  const second = Consumer.create(TestData.Env.defaultEnv, "foo", () =>
    taskEither.right(undefined),
  );
  expect(pipe(await second(), either.isLeft)).toBeTruthy();
});
