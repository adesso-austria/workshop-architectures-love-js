import { either, ioEither, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Adapters from "../adapters";
import * as Repository from "../repository";

/**
 * application environment
 */
export type Env = {
  repositories: {
    event: Repository.Event.Repository;
    todo: Repository.Todo.Repository;
  };
};

/**
 * connect adapters to services and fill into application environment
 */
export const create = ({
  mongoUrl,
  mongoNamespace,
  redisUrl,
  redisNamespace,
}: {
  mongoUrl: string;
  mongoNamespace: string;
  redisUrl: string;
  redisNamespace: string;
}) =>
  pipe(
    taskEither.Do,
    taskEither.apS(
      "mongo",
      Adapters.Mongo.connect({ url: mongoUrl, namespace: mongoNamespace }),
    ),
    taskEither.apS(
      "redis",
      Adapters.Redis.connect({ url: redisUrl, namespace: redisNamespace }),
    ),
    taskEither.map(
      ({ mongo, redis }): Env => ({
        repositories: {
          event: Repository.Event.create({ redis }),
          todo: Repository.Todo.create({ mongo }),
        },
      }),
    ),
  );
