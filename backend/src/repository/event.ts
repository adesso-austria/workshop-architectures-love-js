import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import { Redis } from "../adapters";
import * as Domain from "../domain";

/**
 * public api
 */
export type Repository = {
  addEvent: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, string>;
  getEvents: (
    since: option.Option<string>,
  ) => taskEither.TaskEither<string, Event[]>;
  events$: Rx.Observable<Event>;
};

export type CreateOpts = { redis: Redis.Client };

/**
 * a stringified message, as it is written and read to and from the stream
 */
type Message = { id: string; message: Record<string, string | Buffer> };
/**
 * a parsed message, i.e. a message with parsed content
 */
type Event = { id: string; message: Domain.DomainEvent.DomainEvent };

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
const parseMessage = ({ id, message }: Message): Event => {
  const payload = {
    type: message["type"],
    payload: JSON.parse(message["payload"]?.toString() ?? ""),
  } as Domain.DomainEvent.DomainEvent;
  return { id, message: payload };
};

/**
 * add a new DomainEvent to the stream
 */
const addEvent =
  ({ redis }: CreateOpts): Repository["addEvent"] =>
  (event) =>
    Redis.XADD(redis, "events", "*", createMessageContent(event));

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
const createEvents$ = (opts: CreateOpts): Repository["events$"] => {
  const { redis } = opts;
  return new Rx.Observable<Event>((observer) => {
    function waitForNextMessage(
      id: string,
    ): taskEither.TaskEither<string, void> {
      if (!Redis.isOpen(redis)) {
        return taskEither.left("client is closed");
      }
      return pipe(
        Redis.XREAD(redis, { key: "events", id }),
        taskEither.chain((replies) => {
          if (replies == null) {
            return waitForNextMessage(id);
          }
          const [events] = replies;
          if (events == null) {
            observer.error("no response from events stream");
            return taskEither.left("no response from events stream");
          }

          let lastId: string | undefined;
          events.messages.forEach((entry) => {
            lastId = entry.id;
            observer.next(parseMessage(entry));
          });

          return waitForNextMessage(lastId ?? id);
        }),
      );
    }

    const task = pipe(
      getLastEventId(opts),
      taskEither.chain(waitForNextMessage),
    );
    task();
  }).pipe(Rx.share());
};

export const create = (opts: CreateOpts): Repository => {
  return {
    addEvent: addEvent(opts),
    getEvents: getEvents(opts),
    events$: createEvents$(opts),
  };
};
