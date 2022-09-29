import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Redis from "./redis";
import * as Mongo from "./mongo";

export * as Redis from "./redis";
export * as Mongo from "./mongo";

export type Adapters = { redis: Redis.Adapter; mongo: Mongo.Adapter };

export type ConnectOpts = {
  redis: Redis.ConnectOptions;
  mongo: Mongo.ConnectOptions;
};

export const connect = (
  opts: ConnectOpts,
): taskEither.TaskEither<string, Adapters> => {
  return pipe(
    taskEither.Do,
    taskEither.apS("mongo", Mongo.connect(opts.mongo)),
    taskEither.apS("redis", Redis.connect(opts.redis)),
  );
};
