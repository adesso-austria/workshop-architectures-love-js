import { either, io, ioEither, option, task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
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

export const readEnv =
  (env: NodeJS.ProcessEnv) =>
  (key: string): io.IO<option.Option<string>> =>
  () =>
    pipe(env[key], option.fromNullable);

export const requireEnv =
  (env: NodeJS.ProcessEnv) =>
  (key: string): ioEither.IOEither<string, string> =>
    pipe(
      readEnv(env)(key),
      io.chain(
        flow(
          option.chain(option.fromPredicate((key) => key.length > 0)),
          ioEither.fromOption(() => `${key} is required in env`),
        ),
      ),
    );

export const readProcessEnvironment = (env: NodeJS.ProcessEnv) =>
  pipe(
    ioEither.Do,
    ioEither.apS("mongoUrl", requireEnv(env)("MONGO_URL")),
    ioEither.apS(
      "mongoNamespace",
      pipe(
        readEnv(env)("MONGO_NAMESPACE"),
        io.map(
          flow(
            option.getOrElse(() => ""),
            (value) => either.right<string, string>(value),
          ),
        ),
      ),
    ),
    ioEither.apS("redisUrl", requireEnv(env)("REDIS_URL")),
    ioEither.apS(
      "redisNamespace",
      pipe(
        readEnv(env)("REDIS_NAMESPACE"),
        io.map(
          flow(
            option.getOrElse(() => ""),
            (value) => either.right<string, string>(value),
          ),
        ),
      ),
    ),
  );

export const createAdapters = ({
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
    task.Do,
    task.apS(
      "mongo",
      Adapters.Mongo.connect({ url: mongoUrl, namespace: mongoNamespace }),
    ),
    task.apS(
      "redis",
      Adapters.Redis.connect({ url: redisUrl, namespace: redisNamespace }),
    ),
    task.chain(({ mongo, redis }) => {
      if (either.isRight(mongo) && either.isRight(redis)) {
        return taskEither.right({ mongo: mongo.right, redis: redis.right });
      }
      if (either.isLeft(mongo) && either.isRight(redis)) {
        return pipe(
          redis.right.close(),
          task.map(() => mongo),
        );
      }
      if (either.isRight(mongo) && either.isLeft(redis)) {
        return pipe(
          mongo.right.close(),
          task.map(() => redis),
        );
      }
      return task.of(
        pipe(either.Do, either.apS("mongo", mongo), either.apS("redis", redis)),
      );
    }),
  );

export const createEnv = ({
  mongo,
  redis,
}: {
  mongo: Adapters.Mongo.Adapter;
  redis: Adapters.Redis.Client;
}): Env => ({
  repositories: {
    event: Repository.Event.create({ mongo, redis }),
    todo: Repository.Todo.create({ mongo }),
  },
});

export const loadEnv = (env: NodeJS.ProcessEnv) =>
  pipe(
    readProcessEnvironment(env),
    taskEither.fromIOEither,
    taskEither.chain(createAdapters),
    taskEither.map(createEnv),
  );
