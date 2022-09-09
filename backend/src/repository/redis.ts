import { ioEither, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "redis";
// eslint-disable-next-line import/no-internal-modules

type RedisClient = ReturnType<typeof Redis["createClient"]>;
type MessageContent = Record<string, string | Buffer>;
type RedisMessage = { id: string; message: MessageContent };

export type Client = {
  disconnect: () => taskEither.TaskEither<string, void>;
  addEvent: (event: MessageContent) => taskEither.TaskEither<string, string>;
  getEvents: (
    since: option.Option<string>
  ) => taskEither.TaskEither<string, RedisMessage[]>;
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
  (message: MessageContent) =>
    taskEither.tryCatch(
      () => client.XADD(eventsKey, "*", message),
      (reason) => reason as string,
    );

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

export const connect = ({
  url,
  namespace,
}: ConnectOptions): taskEither.TaskEither<string, Client> => {
  if (url == null) {
    return taskEither.left("need to have a url to know where to connect to");
  }
  return pipe(
    ioEither.tryCatch(
      () => Redis.createClient({ url }),
      () => "could not create db",
    ),
    taskEither.fromIOEither,
    taskEither.chain((client) =>
      taskEither.tryCatch(
        () => client.connect().then(() => client),
        () => "could not connect to client",
      ),
    ),
    taskEither.map(
      (client): RedisEnv => ({
        client,
        eventsKey: namespace === "" ? "events" : `${namespace}-events`,
      }),
    ),
    taskEither.map(
      (env): Client => ({
        disconnect: disconnect(env),
        addEvent: addEvent(env),
        getEvents: getEvents(env),
      }),
    ),
  );
};
