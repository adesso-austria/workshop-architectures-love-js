import { ioEither, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "redis";
// eslint-disable-next-line import/no-internal-modules
import { RedisFlushModes } from "@redis/client/dist/lib/commands/FLUSHALL";
import { ignore } from "utils";

export type Client = ReturnType<typeof Redis["createClient"]> & {
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
      (client): Client =>
        Object.assign({}, client, {
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
