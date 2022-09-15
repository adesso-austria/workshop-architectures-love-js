import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "redis";
import * as Rx from "rxjs";

export type ConnectOptions = {
  url: string;
  namespace: string;
};

type MessageContent = Record<string, string | Buffer>;
export type Message = { id: string; message: MessageContent };

export type Adapter = {
  streamAdd: (
    key: string,
    message: MessageContent,
  ) => taskEither.TaskEither<string, string>;
  streamSubscribe: (key: string, since: string) => Rx.Observable<Message>;
  streamRange: (
    key: string,
    from: string,
    to: string,
  ) => taskEither.TaskEither<string, Message[]>;
  close: () => taskEither.TaskEither<string, void>;
};

type RedisClient = ReturnType<typeof Redis["createClient"]>;
type Instance = {
  client: RedisClient;
  namespace: string;
};

export const buildKey = (prefix: string, key: string) =>
  prefix === "" ? key : `${prefix}-${key}`;

const unsafeAsString = (x: unknown) => x as string;

const taskify = <T>(fn: () => Promise<T>): taskEither.TaskEither<string, T> =>
  taskEither.tryCatch(fn, unsafeAsString);

const createStreamAdd =
  ({ client, namespace }: Instance): Adapter["streamAdd"] =>
  (key, message) =>
    taskify(() => client.XADD(buildKey(namespace, key), "*", message));

const createStreamSubscribe =
  ({ client, namespace }: Instance): Adapter["streamSubscribe"] =>
  (key, since) =>
    new Rx.Observable<Message>((observer) => {
      const abortController = new AbortController();

      client.on("end", () => {
        observer.complete();
        abortController.abort();
      });

      client.executeIsolated(async (isolatedClient) => {
        /**
         * recursively calls itself after each event, emitting the read events on the observer
         */
        const waitForNextEmit = (lastId: string): Promise<void> => {
          if (!client.isOpen || abortController.signal.aborted) {
            observer.complete();
            return isolatedClient.quit();
          }
          return isolatedClient
            .XREAD(
              Redis.commandOptions({ signal: abortController.signal }),
              {
                key: buildKey(namespace, key),
                id: lastId,
              },
              { BLOCK: 0 },
            )
            .then((messages) => {
              if (messages == null) {
                return observer.error("unexpected socket close");
              }
              const [messagesForKey] = messages;
              if (messagesForKey == null) {
                return observer.error("read no messages for key");
              }

              let nextLastId = lastId;
              for (const message of messagesForKey.messages) {
                observer.next(message);
                nextLastId = message.id;
              }
              return waitForNextEmit(nextLastId);
            })
            .catch((reason) => {
              if (reason instanceof Redis.AbortError) {
                observer.complete();
                return Promise.resolve();
              }
              observer.error(reason);
              return Promise.reject(reason);
            });
        };

        return waitForNextEmit(since);
      });

      return () => {
        abortController.abort("unsubscribe");
      };
    });

const createStreamRange =
  ({ client, namespace }: Instance): Adapter["streamRange"] =>
  (key, from, to) =>
    taskify(() => client.XRANGE(buildKey(namespace, key), from, to));

const createClientClose =
  ({ client }: Instance): Adapter["close"] =>
  () =>
    taskify(() => client.disconnect());

/**
 * connect and create a redis client
 */
export const connect = ({
  url,
  namespace,
}: ConnectOptions): taskEither.TaskEither<string, Adapter> => {
  return pipe(
    taskify<Instance>(() => {
      const client = Redis.createClient({ url });
      return client.connect().then(() => ({
        client,
        namespace,
      }));
    }),
    taskEither.map(
      (instance): Adapter => ({
        streamAdd: createStreamAdd(instance),
        streamSubscribe: createStreamSubscribe(instance),
        streamRange: createStreamRange(instance),
        close: createClientClose(instance),
      }),
    ),
  );
};
