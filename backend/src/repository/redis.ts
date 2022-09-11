import { ioEither, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "redis";
import * as Rx from "rxjs";

type RedisClient = ReturnType<typeof Redis["createClient"]>;
type MessageContent = Record<string, string | Buffer>;
type RedisMessage = { id: string; message: MessageContent };

export type Client = {
  disconnect: () => taskEither.TaskEither<string, void>;
  addEvent: (event: MessageContent) => taskEither.TaskEither<string, string>;
  getEvents: (
    since: option.Option<string>
  ) => taskEither.TaskEither<string, RedisMessage[]>;
  events$: Rx.Observable<RedisMessage>;
};

export type ConnectOptions = {
  url: string;
  namespace: string;
};

type RedisEnv = {
  client: RedisClient;
  /**
   * the key of the events stream
   */
  eventsKey: string;
};

const disconnect =
  ({ client }: RedisEnv): Client["disconnect"] =>
  () =>
    taskEither.tryCatch(
      () => client.disconnect(),
      (reason) => reason as string,
    );

const addEvent =
  ({ client, eventsKey }: RedisEnv): Client["addEvent"] =>
  (message: MessageContent) => {
    return taskEither.tryCatch(
      () => client.XADD(eventsKey, "*", message),
      (reason) => reason as string,
    );
  };

const getEvents =
  ({ client, eventsKey }: RedisEnv): Client["getEvents"] =>
  (since: option.Option<string>) =>
    pipe(
      taskEither.tryCatch(
        () =>
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
    );

const getLastEventId = ({ client, eventsKey }: RedisEnv) =>
  client
    .XINFO_STREAM(eventsKey)
    .then((info) => info.lastGeneratedId)
    .catch(() => "0");

const createEvents$ = (env: RedisEnv): Client["events$"] => {
  const { client, eventsKey } = env;
  return new Rx.Observable<RedisMessage>((observer) => {
    function waitForNextEmit(id: string): Promise<void> {
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
            return waitForNextEmit(id);
          }
          const [events] = replies;
          if (events == null) {
            return observer.error("no response from events stream");
          }

          let lastId: string | undefined;
          events.messages.forEach((message) => {
            lastId = message.id;
            observer.next(message);
          });

          return waitForNextEmit(lastId ?? id);
        });
    }

    getLastEventId(env).then(waitForNextEmit);
  }).pipe(Rx.share());
};

const create = ({ url, namespace }: ConnectOptions): Promise<RedisEnv> => {
  const client = Redis.createClient({ url });
  return client.connect().then(() => ({
    client,
    eventsKey: namespace === "" ? "events" : `${namespace}-events`,
  }));
};

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
