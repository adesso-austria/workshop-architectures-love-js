import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "redis";
import * as Rx from "rxjs";
import * as Domain from "../domain";

export type ConnectOptions = {
  url: string;
  namespace: string;
};

/**
 * public api
 */
export type Client = {
  disconnect: () => taskEither.TaskEither<string, void>;
  addEvent: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, string>;
  getEvents: (
    since: option.Option<string>,
  ) => taskEither.TaskEither<string, Event[]>;
  events$: Rx.Observable<Event>;
};

/**
 * module local environment
 */
type RedisEnv = {
  client: RedisClient;
  /**
   * the key of the events stream
   */
  eventsKey: string;
};

type RedisClient = ReturnType<typeof Redis["createClient"]>;
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
 * gracefully disconnects the client
 */
const disconnect =
  ({ client }: RedisEnv): Client["disconnect"] =>
  () =>
    taskEither.tryCatch(
      () => client.quit(),
      (reason) => reason as string,
    );

/**
 * add a new DomainEvent to the stream
 */
const addEvent =
  ({ client, eventsKey }: RedisEnv): Client["addEvent"] =>
  (event) => {
    return taskEither.tryCatch(
      () => client.XADD(eventsKey, "*", createMessageContent(event)),
      (reason) => reason as string,
    );
  };

/**
 * get events since id X
 */
const getEvents =
  ({ client, eventsKey }: RedisEnv): Client["getEvents"] =>
  (since) =>
    pipe(
      taskEither.tryCatch(
        () =>
          // TODO: replace with XREAD
          client.XRANGE(
            eventsKey,
            pipe(
              since,
              option.map((id) => `(${id}`),
              option.getOrElse(() => "-"),
            ),
            "+",
          ),
        (reason) => reason as string,
      ),
      taskEither.map((events) => events.map(parseMessage)),
    );

/**
 * get the last generated stream entry id or 0 if the stream is empty
 */
const getLastEventId = ({ client, eventsKey }: RedisEnv) =>
  client
    .XINFO_STREAM(eventsKey)
    .then((info) => info.lastGeneratedId)
    .catch(() => "0");

/**
 * create the observable of events
 */
const createEvents$ = (env: RedisEnv): Client["events$"] => {
  const { client, eventsKey } = env;
  return new Rx.Observable<Event>((observer) => {
    function waitForNextMessage(id: string): Promise<void> {
      if (!client.isOpen) {
        return Promise.resolve();
      }
      return client
        .XREAD(Redis.commandOptions({ isolated: true }), {
          key: eventsKey,
          id,
        })
        .catch((e) => {
          console.error(eventsKey, e);
          return Promise.reject(e);
        })
        .then((replies) => {
          if (replies == null) {
            return waitForNextMessage(id);
          }
          const [events] = replies;
          if (events == null) {
            return observer.error("no response from events stream");
          }

          let lastId: string | undefined;
          events.messages.forEach((entry) => {
            lastId = entry.id;
            observer.next(parseMessage(entry));
          });

          return waitForNextMessage(lastId ?? id);
        });
    }

    getLastEventId(env).then(waitForNextMessage);
  }).pipe(Rx.share());
};

/**
 * create a new redis client and connect it
 */
const create = ({ url, namespace }: ConnectOptions): Promise<RedisEnv> => {
  const client = Redis.createClient({ url });
  return client.connect().then(() => ({
    client,
    eventsKey: namespace === "" ? "events" : `${namespace}-events`,
  }));
};

/**
 * connect and create a redis client
 */
export const connect = (
  options: ConnectOptions,
): taskEither.TaskEither<string, Client> => {
  return pipe(
    taskEither.tryCatch(
      () => create(options),
      (reason) => reason as string,
    ),
    taskEither.map(
      (env): Client => ({
        events$: createEvents$(env),
        disconnect: disconnect(env),
        addEvent: addEvent(env),
        getEvents: getEvents(env),
      }),
    ),
  );
};
