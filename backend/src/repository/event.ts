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
 * a stringified message, as it is written and read to and from the stream
 */
type Message = { id: string; message: Record<string, string | Buffer> };

/**
 * transform a domain event into a redis message without id
 */
const createMessageContent = (
  event: Domain.DomainEvent.DomainEvent,
): Message["message"] => ({
  type: event.type,
  payload: JSON.stringify(event.payload),
});

/**
 * parse a redis stream entry into an event
 */
const parseMessage = ({ id, message }: Message): Domain.Event.Event => {
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
      Redis.XADD(redis, "events", "*", createMessageContent(event)),
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
      Redis.XRANGE(
        redis,
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

/**
 * get the last generated stream entry id or 0 if the stream is empty
 */
const getLastEventId = ({ redis }: CreateOpts) =>
  pipe(
    Redis.XINFO_STREAM(redis, "events"),
    taskEither.map((info) => info.lastGeneratedId),
    taskEither.alt(() => taskEither.of("0")),
  );

/**
 * create the observable of events
 */
const createEventStream = (opts: CreateOpts): Repository["eventStream"] => {
  const { redis } = opts;
  return pipe(
    getLastEventId(opts),
    taskEither.map((latestId) => {
      return new Rx.Observable<Domain.Event.Event>((observer) => {
        async function waitForNextMessage(id: string): Promise<void> {
          if (!Redis.isOpen(redis)) {
            return Promise.reject("client is closed");
          }
          const readTask = Redis.XREAD(
            redis,
            {},
            {},
            {
              key: "events",
              id,
            },
          );
          const replies = pipe(
            await readTask(),
            either.match(
              (error) => throwException(error),
              (replies) => replies,
            ),
          );
          if (replies == null) {
            return waitForNextMessage(id);
          }
          const [events] = replies;
          if (events == null) {
            observer.error("no response from events stream");
            return Promise.reject("no response from events stream");
          }

          let lastId: string | undefined;
          events.messages.forEach((entry) => {
            lastId = entry.id;
            observer.next(parseMessage(entry));
          });

          return waitForNextMessage(lastId ?? id);
        }

        waitForNextMessage(latestId).catch((error) => {
          observer.error(error);
        });
      }).pipe(Rx.share());
    }),
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
