import * as Crypto from "crypto";
import { it, expect, jest } from "@jest/globals";
import { taskEither } from "fp-ts";
import * as TestData from "../test-data";
import * as Consumer from "./consumer";

it("should not execute the given fn if an event has been acknowledged", async () => {
  const consumerFn = jest.fn(() => taskEither.right<string, void>(undefined));
  const env = TestData.Env.create({
    repositories: {
      event: {
        hasEventBeenAcknowledged: () => taskEither.right(true),
      },
    },
  });
  const consumer = Consumer.create(env, Crypto.randomUUID(), consumerFn);

  const consume = consumer(TestData.Event.createBuyIcecream);
  await consume();

  expect(consumerFn).toHaveBeenCalledTimes(0);
});

it("should acknowledge the event if it is previously unknown", async () => {
  const acknowledgeEvent = jest.fn(() => taskEither.right(undefined));
  const env = TestData.Env.create({
    repositories: {
      event: {
        hasEventBeenAcknowledged: () => taskEither.right(false),
        acknowledgeEvent,
      },
    },
  });
  const consumerId = Crypto.randomUUID();
  const consumer = Consumer.create(env, consumerId, () =>
    taskEither.right(undefined),
  );

  const consume = consumer(TestData.Event.createBuyIcecream);
  await consume();

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
      },
    },
  });

  const consumer = Consumer.create(env, Crypto.randomUUID(), () =>
    taskEither.left("some error"),
  );
  const consume = consumer(TestData.Event.createBuyIcecream);
  await consume();

  expect(acknowledgeEvent).toHaveBeenCalledTimes(0);
});

it("should not be possible to create another consumer with the same name", () => {
  Consumer.create(TestData.Env.defaultEnv, "foo", () =>
    taskEither.right(undefined),
  );
  expect(() =>
    Consumer.create(TestData.Env.defaultEnv, "foo", () =>
      taskEither.right(undefined),
    ),
  ).toThrow();
});
