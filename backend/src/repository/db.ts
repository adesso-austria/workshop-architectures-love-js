import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "./mongo";
import * as Redis from "./redis";

export type Db = {
  mongo: Mongo.Db;
  redis: Redis.Client;
};

export type ConnectOptions = {
  redis?: Redis.ConnectOptions;
  mongo?: Mongo.ConnectOptions;
};

export const connect = ({
  redis: redisOptions = {},
  mongo: mongoOptions = {},
}: ConnectOptions = {}): taskEither.TaskEither<string, Db> =>
  pipe(
    taskEither.Do,
    taskEither.apS("redis", Redis.connect(redisOptions)),
    taskEither.apS(
      "mongo",
      pipe(
        Mongo.connect(mongoOptions),
        taskEither.mapLeft(([error, reason]) => `${error}: ${reason}`)
      )
    )
  );
