import { either, option, task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match, P } from "ts-pattern";
import { ignore } from "utils";
import * as Mongo from "./mongo";
import * as Redis from "./redis";

type Clients = {
  mongo: Mongo.Client;
  redis: Redis.Client;
};

export type Db = Clients & {
  disconnect: () => taskEither.TaskEither<string, void>;
};

export type ConnectOptions = {
  redis: Redis.ConnectOptions;
  mongo: Mongo.ConnectOptions;
};

const disconnect = (clients: Clients) =>
  pipe(
    taskEither.Do,
    taskEither.apS("redis", clients.redis.disconnect()),
    taskEither.apS("mongo", clients.mongo.disconnect()),
    taskEither.map(ignore),
  );

match(option.of("test"))
  .with(option.some(P.select()), (t) => t)
  .with(option.none, () => "none")
  .exhaustive();

export const connect = ({
  redis: redisOptions,
  mongo: mongoOptions,
}: ConnectOptions): taskEither.TaskEither<string, Db> =>
  pipe(
    task.Do,
    task.apS("redis", pipe(Redis.connect(redisOptions))),
    task.apS("mongo", pipe(Mongo.connect(mongoOptions))),
    task.chain(({ redis, mongo }): taskEither.TaskEither<string, Clients> => {
      if (either.isRight(redis) && either.isRight(mongo)) {
        return taskEither.right({
          redis: redis.right,
          mongo: mongo.right,
        });
      }
      if (either.isLeft(redis) && either.isRight(mongo)) {
        return pipe(
          mongo.right.disconnect(),
          taskEither.chain(() => taskEither.left(`redis error: ${redis.left}`)),
        );
      }
      if (either.isRight(redis) && either.isLeft(mongo)) {
        return pipe(
          redis.right.disconnect(),
          taskEither.chain(() => taskEither.left(`mongo error: ${mongo.left}`)),
        );
      }
      if (either.isLeft(redis) && either.isLeft(mongo)) {
        return taskEither.left(
          `errors: {mongo: ${mongo.left}, redis: ${redis.left}}`,
        );
      }
      throw new Error(
        "absurd; branch flow analysis should detect this case as impossible",
      );
    }),
    taskEither.map((clients) => ({
      ...clients,
      disconnect: () => disconnect(clients),
    })),
  );
