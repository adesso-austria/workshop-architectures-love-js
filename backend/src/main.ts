import dotenv from "dotenv";
import { either, io, ioEither, option, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import * as Boundary from "./boundary";
import * as Application from "./application";
import * as Repository from "./repository";
import * as Adapters from "./adapters";

dotenv.config();

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

export const readProcessEnvironment = (
  env: NodeJS.ProcessEnv,
): ioEither.IOEither<string, Adapters.ConnectOpts> =>
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

    ioEither.map((env) => ({
      redis: {
        url: env.redisUrl,
        namespace: env.redisNamespace,
      },
      mongo: {
        url: env.mongoUrl,
        namespace: env.mongoNamespace,
      },
    })),
  );

export const start = pipe(
  readProcessEnvironment(process.env),
  taskEither.fromIOEither,
  taskEither.chain(Adapters.connect),
  taskEither.map(flow(Repository.create, Application.create)),
  taskEither.match(
    (reason) => {
      console.error(reason);
      process.exit(1);
    },
    (env) => {
      Boundary.create(env)
        .listen({
          port: pipe(
            process.env["PORT"],
            option.fromNullable,
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
