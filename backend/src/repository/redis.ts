import { ioEither, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "redis";
// eslint-disable-next-line import/no-internal-modules
import { RedisFlushModes } from "@redis/client/dist/lib/commands/FLUSHALL";
import { ignore } from "utils";

type RedisClient = ReturnType<typeof Redis["createClient"]>;
type RedisMessage = { id: string; message: Record<string, string | Buffer> };

export type Client = {
  emit: (
    message: RedisMessage["message"]
  ) => taskEither.TaskEither<string, void>;
  /**
   * flushes the whole db, won't work in production dbs.
   * Only exists for integration tests
   */
  flush: () => taskEither.TaskEither<string, void>;
  getLastEventId: () => taskEither.TaskEither<string, option.Option<string>>;
  getEventsSince: (
    id: option.Option<string>
  ) => taskEither.TaskEither<string, RedisMessage[]>;
};

const emit =
  (client: RedisClient): Client["emit"] =>
  (message) =>
    taskEither.tryCatch(
      () => client.XADD("events", "*", message).then(ignore),
      () => "could not emit message"
    );

const flush =
  (client: RedisClient): Client["flush"] =>
  () =>
    taskEither.tryCatch(
      () => client.FLUSHDB(RedisFlushModes.ASYNC).then(ignore),
      () => "could not flush db"
    );

const getLastEventId =
  (client: RedisClient): Client["getLastEventId"] =>
  () =>
    pipe(
      taskEither.tryCatch(
        () =>
          client
            .XINFO_STREAM("events")
            .then((info) => option.fromNullable(info.lastEntry?.id))
            .catch((error: Redis.ErrorReply) =>
              error.message === "ERR no such key"
                ? option.none
                : Promise.reject(error)
            ),
        (reason) => (reason as Redis.ErrorReply).message
      )
    );

const getEventsSince =
  (client: RedisClient): Client["getEventsSince"] =>
  (since) =>
    pipe(
      taskEither.tryCatch(
        () =>
          client.XRANGE(
            "events",
            pipe(
              since,
              option.getOrElse(() => "-")
            ),
            "+"
          ),
        () => "could not read events since"
      )
    );

export type ConnectOptions = {
  url?: string;
  db?: number;
};

export const connect = ({
  url = process.env["REDIS_URL"],
  db = 0,
}: ConnectOptions = {}): taskEither.TaskEither<string, Client> => {
  if (url == null) {
    return taskEither.left("need to have a url to know where to connect to");
  }
  return pipe(
    ioEither.tryCatch(
      () => Redis.createClient({ url, database: db }),
      () => "could not create db"
    ),
    taskEither.fromIOEither,
    taskEither.chain((client) =>
      taskEither.tryCatch(
        () => client.connect().then(() => client),
        () => "could not connect to client"
      )
    ),
    taskEither.map(
      (client): Client => ({
        emit: emit(client),
        flush:
          db == 0
            ? () => taskEither.left("refusing to delete events in prod db")
            : flush(client),
        getLastEventId: getLastEventId(client),
        getEventsSince: getEventsSince(client),
      })
    )
  );
};
