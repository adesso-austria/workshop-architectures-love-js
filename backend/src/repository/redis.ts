import { ioEither, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "redis";
// eslint-disable-next-line import/no-internal-modules
import { RedisFlushModes } from "@redis/client/dist/lib/commands/FLUSHALL";
import { ignore } from "utils";

type MessageContent = Record<string, string | Buffer>;
type RedisMessage = { id: string; message: MessageContent };

export type Client = {
  addEvent: (event: MessageContent) => taskEither.TaskEither<string, void>;
  getEvents: (
    since: option.Option<string>
  ) => taskEither.TaskEither<string, RedisMessage[]>;
  flush: () => taskEither.TaskEither<string, void>;
};

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
        addEvent: (message) =>
          taskEither.tryCatch(
            () => client.XADD("events", "*", message).then(ignore),
            (reason) => reason as string
          ),
        getEvents: (since) =>
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
            (reason) => reason as string
          ),
        flush: () =>
          db === 0
            ? taskEither.left("refusing to drop prod db")
            : taskEither.tryCatch(
                () => client.flushDb(RedisFlushModes.ASYNC).then(ignore),
                (reason) => reason as string
              ),
      })
    )
  );
};
