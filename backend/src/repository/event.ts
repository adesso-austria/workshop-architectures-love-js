import { either, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import { ignore, throwException } from "utils";
import { Mongo, Redis } from "../adapters";
import * as Domain from "../domain";

/**
 * public api
 */
export type Repository = {
  addEvent: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, Domain.Event.Event>;
  getEvents: (
    since: option.Option<string>,
  ) => taskEither.TaskEither<string, Domain.Event.Event[]>;
  eventStream: taskEither.TaskEither<string, Rx.Observable<Domain.Event.Event>>;
  acknowledgeEvent: (
    consumer: string,
    eventId: string,
  ) => taskEither.TaskEither<string, void>;
  hasEventBeenAcknowledged: (
    consumer: string,
    eventId: string,
  ) => taskEither.TaskEither<string, boolean>;
};

export type CreateOpts = { redis: Redis.Client; mongo: Mongo.Client };

/**
 * transform a domain event into a redis message without id
 */
const createMessageContent = (
  event: Domain.DomainEvent.DomainEvent,
): Redis.Message["message"] => ({
  type: event.type,
  payload: JSON.stringify(event.payload),
});

/**
 * parse a redis stream entry into an event
 */
const parseMessage = ({ id, message }: Redis.Message): Domain.Event.Event => {
  const payload = {
    type: message["type"],
    payload: JSON.parse(message["payload"]?.toString() ?? ""),
  } as Domain.DomainEvent.DomainEvent;
  return { id, domainEvent: payload };
};

/**
 * add a new DomainEvent to the stream
 */
const addEvent =
  ({ redis }: CreateOpts): Repository["addEvent"] =>
  (event) => {
    return pipe(
      redis.streamAdd("events", createMessageContent(event)),
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
        "events",
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
  _: CreateOpts,
): taskEither.TaskEither<string, string> => taskEither.right("0");

/**
 * create the observable of events
 */
const createEventStream = (opts: CreateOpts): Repository["eventStream"] => {
  return pipe(
    getLastKnownEventId(opts),
    taskEither.map((id) =>
      opts.redis.streamSubscribe("events", id).pipe(Rx.map(parseMessage)),
    ),
  );
};

const acknowledgeEvent =
  ({ mongo }: CreateOpts): Repository["acknowledgeEvent"] =>
  (consumer, eventId) =>
    pipe(
      taskEither.tryCatch(
        () =>
          mongo.acknowledgedEvents
            .insertOne({ consumer, eventId })
            .then(ignore),
        (reason) => reason as string,
      ),
    );

const hasEventBeenAcknowledged =
  ({ mongo }: CreateOpts): Repository["hasEventBeenAcknowledged"] =>
  (consumer, eventId) =>
    pipe(
      taskEither.tryCatch(
        () =>
          mongo.acknowledgedEvents
            .findOne({ consumer, eventId })
            .then((event) => event != null),
        (reason) => reason as string,
      ),
    );

export const create = (opts: CreateOpts): Repository => {
  return {
    addEvent: addEvent(opts),
    getEvents: getEvents(opts),
    eventStream: createEventStream(opts),
    acknowledgeEvent: acknowledgeEvent(opts),
    hasEventBeenAcknowledged: hasEventBeenAcknowledged(opts),
  };
};
