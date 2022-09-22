import { either, task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import * as TestData from "../test-data";
import * as EventHandler from "./event-handler";

it("should process unknown events first", async () => {
  const handlerFn = jest.fn(() => taskEither.right(undefined));
  const handler = EventHandler.create(
    TestData.Repository.create({
      event: {
        addEvent: () => taskEither.right(TestData.Event.createBuyMilk),
        getUnknownEvents: () =>
          taskEither.right([TestData.Event.createBuyIcecream]),
        createEventStream: () => Rx.of(TestData.Event.createBuyMilk),
      },
    }),
    "foo",
    handlerFn,
  );

  const handleEvent = handler(TestData.DomainEvent.createBuyMilk);
  await handleEvent();

  expect(handlerFn).toHaveBeenNthCalledWith(
    1,
    TestData.Event.createBuyIcecream.domainEvent,
  );
  expect(handlerFn).toHaveBeenNthCalledWith(
    2,
    TestData.Event.createBuyMilk.domainEvent,
  );
});

it("should not call the handlerFn if events are already known", async () => {
  const handlerFn = jest.fn(() => taskEither.right(undefined));

  const handler = EventHandler.create(
    TestData.Repository.create({
      event: {
        addEvent: () => taskEither.right(TestData.Event.createBuyMilk),
        hasEventBeenAcknowledged: () => taskEither.right(true),
        createEventStream: () => Rx.of(TestData.Event.createBuyMilk),
      },
    }),
    "foo",
    handlerFn,
  );

  const handleEvent = handler(TestData.DomainEvent.createBuyMilk);
  await handleEvent();

  expect(handlerFn).toHaveBeenCalledTimes(0);
});

it("should acknowledge successfully processed events", async () => {
  const acknowledgeEvent = jest.fn(() => taskEither.right(undefined));

  const handler = EventHandler.create(
    TestData.Repository.create({
      event: {
        addEvent: () => taskEither.right(TestData.Event.createBuyMilk),
        acknowledgeEvent,
        createEventStream: () => Rx.of(TestData.Event.createBuyMilk),
      },
    }),
    "foo",
    () => taskEither.right(undefined),
  );

  const handleEvent = handler(TestData.DomainEvent.createBuyMilk);
  await handleEvent();

  expect(acknowledgeEvent).toHaveBeenCalled();
});

it("should not acknowledge the event if the handler fails", async () => {
  const acknowledgeEvent = jest.fn(() => taskEither.right(undefined));

  const handler = EventHandler.create(
    TestData.Repository.create({
      event: {
        addEvent: () => taskEither.right(TestData.Event.createBuyMilk),
        acknowledgeEvent,
        createEventStream: () => Rx.of(TestData.Event.createBuyMilk),
      },
    }),
    "foo",
    () => taskEither.left("some error"),
  );

  const handleEvent = handler(TestData.DomainEvent.createBuyMilk);
  await handleEvent();

  expect(acknowledgeEvent).not.toHaveBeenCalled();
});

it("should process events strictly in order, even if handling one event is much faster", async () => {
  const handler = EventHandler.create(
    TestData.Repository.create({
      event: {
        addEvent: () => taskEither.right(TestData.Event.createBuyMilk),
        createEventStream: () => Rx.of(TestData.Event.createBuyMilk),
      },
    }),
    "foo",
    jest
      .fn()
      // first invocation should take 200ms
      .mockReturnValueOnce(pipe(taskEither.right(undefined), task.delay(50)))
      // second invocation should be instance
      .mockReturnValueOnce(taskEither.right(undefined)),
  );

  const first = pipe(
    handler(TestData.DomainEvent.createBuyMilk),
    taskEither.map(() => "first"),
  );
  const second = pipe(
    handler(TestData.DomainEvent.createBuyMilk),
    taskEither.map(() => "second"),
  );

  const winner = Promise.race([first(), second()]);
  expect(winner).resolves.toEqual(either.right("first"));
});

describe("transactions", () => {
  it.todo("should not commit a transaction if acknowledging the event fails");
});
