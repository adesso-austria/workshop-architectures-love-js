import { either, io, ioEither, option, task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import * as Boundary from "./boundary";
import * as Adapters from "./adapters";
import * as Application from "./application";
import * as Repository from "./repository";

export const readEnv =
  (key: string): io.IO<option.Option<string>> =>
  () =>
    pipe(process.env[key], option.fromNullable);

export const requireEnv = (key: string): ioEither.IOEither<string, string> =>
  pipe(
    readEnv(key),
    io.chain(
      flow(
        option.chain(option.fromPredicate((key) => key.length > 0)),
        ioEither.fromOption(() => `${key} is required in env`),
      ),
    ),
  );

export const readProcessEnvironment = pipe(
  ioEither.Do,
  ioEither.apS("mongoUrl", requireEnv("MONGO_URL")),
  ioEither.apS(
    "mongoNamespace",
    pipe(
      readEnv("MONGO_NAMESPACE"),
      io.map(
        flow(
          option.getOrElse(() => ""),
          (value) => either.right<string, string>(value),
        ),
      ),
    ),
  ),
  ioEither.apS("redisUrl", requireEnv("REDIS_URL")),
  ioEither.apS(
    "redisNamespace",
    pipe(
      readEnv("REDIS_NAMESPACE"),
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
          Adapters.Redis.disconnect(redis.right),
          task.map(() => mongo),
        );
      }
      if (either.isRight(mongo) && either.isLeft(redis)) {
        return pipe(
          mongo.right.disconnect(),
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
  mongo: Adapters.Mongo.Client;
  redis: Adapters.Redis.Client;
}): Application.Env.Env => ({
  repositories: {
    event: Repository.Event.create({ redis }),
    todo: Repository.Todo.create({ mongo }),
  },
});

export const start = pipe(
  readProcessEnvironment,
  taskEither.fromIOEither,
  taskEither.chain(createAdapters),
  taskEither.map(createEnv),
  taskEither.match(
    (reason) => {
      console.error(reason);
      process.exit(1);
    },
    (env) => {
      Application.create(env).start();

      Boundary.create(env)
        .listen({
          port: pipe(
            readEnv("PORT")(),
            option.map(parseInt),
            option.match(
              () => 8080,
              (parsed) => {
                if (Number.isNaN(parsed)) {
                  throw new Error("please pass a valid number for PORT");
                }
                return parsed;
              },
            ),
          ),
        })
        .then((address) => console.log(`server up and running on ${address}`))
        .catch((e) => {
          console.error(e);
          process.exit(1);
        });
    },
  ),
);
