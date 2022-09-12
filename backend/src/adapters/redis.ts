import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "redis";

const unsafeAsString = (x: unknown) => x as string;

export type ConnectOptions = {
  url: string;
  namespace: string;
};

export type Client = {
  instance: ReturnType<typeof Redis["createClient"]>;
  prefix: string;
};

type MessageContent = Record<string, string | Buffer>;

/**
 * connect and create a redis client
 */
export const connect = ({
  url,
  namespace,
}: ConnectOptions): taskEither.TaskEither<string, Client> => {
  return pipe(
    taskEither.tryCatch(
      () => {
        const client = Redis.createClient({ url });
        return client.connect().then(() => ({
          instance: client,
          prefix: namespace === "" ? "" : `${namespace}-`,
        }));
      },
      (reason) => reason as string,
    ),
  );
};

const buildKey = (prefix: string, key: string) =>
  prefix === "" ? key : `${prefix}-${key}`;

export const XADD = (
  { instance, prefix }: Client,
  key: string,
  id: string,
  content: MessageContent,
) =>
  taskEither.tryCatch(
    () => instance.XADD(buildKey(prefix, key), id, content),
    unsafeAsString,
  );

export const XRANGE = (
  { instance, prefix }: Client,
  key: string,
  from: string,
  to: string,
) =>
  taskEither.tryCatch(
    () => instance.XRANGE(buildKey(prefix, key), from, to),
    unsafeAsString,
  );

export const XINFO_STREAM = ({ instance, prefix }: Client, key: string) =>
  taskEither.tryCatch(
    () => instance.XINFO_STREAM(buildKey(prefix, key)),
    unsafeAsString,
  );

export const XREAD = (
  { instance, prefix }: Client,
  ...streams: Array<{ key: string; id: string }>
) =>
  taskEither.tryCatch(
    () =>
      instance.XREAD(
        streams.map(({ key, id }) => ({ key: buildKey(prefix, key), id })),
      ),
    unsafeAsString,
  );

export const isOpen = ({ instance }: Client) => instance.isOpen;

export const commandOptions = Redis.commandOptions;

export const disconnect = ({
  instance,
}: Client): taskEither.TaskEither<string, void> =>
  taskEither.tryCatch(
    () => instance.quit(),
    (reason) => reason as string,
  );
