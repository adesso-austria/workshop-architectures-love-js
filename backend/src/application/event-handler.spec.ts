import { either, task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Test from "../test";
import * as EventHandler from "./event-handler";

it("should process unknown events first", async () => {
  const handlerFn = jest.fn(() => taskEither.right(undefined));
  const handler = EventHandler.create(
    Test.Repository.create({
      event: {
        getUnknownEvents: () =>
          taskEither.right([Test.Data.Event.createBuyIcecream]),
      },
    }),
    "foo",
    handlerFn,
  );

  const handleEvent = handler(Test.Data.DomainEvent.createBuyMilk);
  await handleEvent();

  expect(handlerFn).toHaveBeenCalledTimes(2);

  expect(handlerFn).toHaveBeenNthCalledWith(
    1,
    Test.Data.Event.createBuyIcecream.domainEvent,
  );
  expect(handlerFn).toHaveBeenNthCalledWith(
    2,
    Test.Data.Event.createBuyMilk.domainEvent,
  );
});

it("should not call the handlerFn if events are already known", async () => {
  const handlerFn = jest.fn(() => taskEither.right(undefined));

  const handler = EventHandler.create(
    Test.Repository.create({
      event: {
        hasEventBeenAcknowledged: () => taskEither.right(true),
      },
    }),
    "foo",
    handlerFn,
  );

  const handleEvent = handler(Test.Data.DomainEvent.createBuyMilk);
  await handleEvent();

  expect(handlerFn).toHaveBeenCalledTimes(0);
});

it("should acknowledge successfully processed events", async () => {
  const acknowledgeEvent = jest.fn(() => taskEither.right(undefined));

  const handler = EventHandler.create(
    Test.Repository.create({
      event: {
        acknowledgeEvent,
      },
    }),
    "foo",
    () => taskEither.right(undefined),
  );

  const handleEvent = handler(Test.Data.DomainEvent.createBuyMilk);
  await handleEvent();

  expect(acknowledgeEvent).toHaveBeenCalled();
});

it("should not acknowledge the event if the handler fails", async () => {
  const acknowledgeEvent = jest.fn(() => taskEither.right(undefined));

  const handler = EventHandler.create(
    Test.Repository.create({
      event: {
        acknowledgeEvent,
      },
    }),
    "foo",
    () => taskEither.left("some error"),
  );

  const handleEvent = handler(Test.Data.DomainEvent.createBuyMilk);
  await handleEvent();

  expect(acknowledgeEvent).not.toHaveBeenCalled();
});

it("should process events strictly in order, even if handling one event is much faster", async () => {
  const handler = EventHandler.create(
    Test.Repository.create({}),
    "foo",
    jest
      .fn()
      // first invocation should take 50ms
      .mockReturnValueOnce(pipe(taskEither.right(undefined), task.delay(50)))
      // second invocation should be instant
      .mockReturnValueOnce(taskEither.right(undefined)),
  );

  const first = pipe(
    handler(Test.Data.DomainEvent.createBuyMilk),
    taskEither.map(() => "first"),
  );
  const second = pipe(
    handler(Test.Data.DomainEvent.createBuyMilk),
    taskEither.map(() => "second"),
  );

  const winner = Promise.race([first(), second()]);
  await expect(winner).resolves.toEqual(either.right("first"));
});

describe("transactions", () => {
  it.todo("should not commit a transaction if acknowledging the event fails");
});
