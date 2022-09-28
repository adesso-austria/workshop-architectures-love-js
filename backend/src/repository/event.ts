import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import { Mongo, Redis } from "../adapters";
import * as Domain from "../domain";

/**
 * public api
 */
export type Repository = {
  addEvent: <T extends Domain.DomainEvent.DomainEvent>(
    event: T,
  ) => taskEither.TaskEither<string, Domain.Event.Event>;
  getEvents: (
    since: option.Option<string>,
  ) => taskEither.TaskEither<string, Domain.Event.Event[]>;
  createEventStream: (
    since: option.Option<string>,
  ) => Rx.Observable<Domain.Event.Event>;
  getUnknownEvents: (
    consumer: string,
  ) => taskEither.TaskEither<string, Domain.Event.Event[]>;
  acknowledgeEvent: (
    consumer: string,
    eventId: string,
  ) => taskEither.TaskEither<string, void>;
  hasEventBeenAcknowledged: (
    consumer: string,
    eventId: string,
  ) => taskEither.TaskEither<string, boolean>;
};

export type CreateOpts = { redis: Redis.Adapter; mongo: Mongo.Adapter };

type ConsumedEvent = { consumer: string; id: string };

/**
 * @internal - only exported for unit testing
 */
export const eventsKey = "events";
/**
 * @internal - only exported for unit testing
 */
export const ackEventsKey = "acknowledgedEvents";

/**
 * @interal - only exported for unit testing
 * transform a domain event into a redis message without id
 */
export const stringifyDomainEvent = (
  event: Domain.DomainEvent.DomainEvent,
): Redis.Message["message"] => ({
  type: event.type,
  payload: JSON.stringify(event.payload),
});

/**
 * @interal - only exported for unit testing
 * parse a redis stream entry into an event
 */
export const parseMessage = ({
  id,
  message,
}: Redis.Message): Domain.Event.Event => {
  const payload = {
    type: message["type"],
    payload: JSON.parse(message["payload"]?.toString() ?? ""),
  } as Domain.DomainEvent.DomainEvent;
  return { id, domainEvent: payload };
};

/**
 * add a new DomainEvent to the stream
 */
const createAddEvent =
  ({ redis }: CreateOpts): Repository["addEvent"] =>
  (event) => {
    return pipe(
      redis.streamAdd(eventsKey, stringifyDomainEvent(event)),
      taskEither.map((id) => ({ id, domainEvent: event })),
    );
  };

/**
 * get events since id X
 */
const getEvents =
  ({ redis }: CreateOpts): Repository["getEvents"] =>
  (since) =>
    pipe(
      redis.streamRange(
        eventsKey,
        pipe(
          since,
          option.map((id) => `(${id}`),
          option.getOrElse(() => "-"),
        ),
        "+",
      ),
      taskEither.map((events) => events.map(parseMessage)),
    );

const getLastKnownEventId = (
  { mongo }: CreateOpts,
  forConsumer: string,
): taskEither.TaskEither<string, option.Option<string>> =>
  pipe(
    mongo.findLast<ConsumedEvent>(ackEventsKey, { consumer: forConsumer }),
    taskEither.map(option.map(({ id }) => id)),
  );

const createEventStream =
  (opts: CreateOpts): Repository["createEventStream"] =>
  (since) =>
    opts.redis.streamSubscribe(eventsKey, since).pipe(Rx.map(parseMessage));

const getUnknownEvents =
  (opts: CreateOpts): Repository["getUnknownEvents"] =>
  (consumer) =>
    pipe(
      getLastKnownEventId(opts, consumer),
      taskEither.chain(getEvents(opts)),
    );

const acknowledgeEvent =
  ({ mongo }: CreateOpts): Repository["acknowledgeEvent"] =>
  (consumer, id) =>
    mongo.addOne<ConsumedEvent>(ackEventsKey, { consumer, id });

const hasEventBeenAcknowledged =
  ({ mongo }: CreateOpts): Repository["hasEventBeenAcknowledged"] =>
  (consumer, eventId) =>
    pipe(
      mongo.findOne(ackEventsKey, { consumer, eventId }),
      taskEither.map(option.isSome),
    );

export const create = (opts: CreateOpts): Repository => {
  return {
    addEvent: createAddEvent(opts),
    getEvents: getEvents(opts),
    getUnknownEvents: getUnknownEvents(opts),
    acknowledgeEvent: acknowledgeEvent(opts),
    hasEventBeenAcknowledged: hasEventBeenAcknowledged(opts),
    createEventStream: createEventStream(opts),
  };
};
