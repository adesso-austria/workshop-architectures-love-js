import dotenv from "dotenv";
import { either, ioEither, option, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import * as Boundary from "./boundary";
import * as Application from "./application";
dotenv.config();

const readEnv = (key: string): option.Option<string> =>
  pipe(process.env[key], option.fromNullable);

const requireEnv = (key: string) =>
  pipe(
    readEnv(key),
    ioEither.fromOption(() => `${key} is required in env`),
  );

const createApplicationEnvironment = pipe(
  ioEither.Do,
  ioEither.apS("mongoUrl", requireEnv("MONGO_URL")),
  ioEither.apS("mongoNamespace", requireEnv("MONGO_NAMESPACE")),
  ioEither.apS("redisUrl", requireEnv("REDIS_URL")),
  ioEither.apS("redisNamespace", requireEnv("REDIS_NAMESPACE")),
  taskEither.fromIOEither,
  taskEither.chain(Application.Env.create),
);

const start = pipe(
  createApplicationEnvironment,
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
            readEnv("PORT"),
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

start();
