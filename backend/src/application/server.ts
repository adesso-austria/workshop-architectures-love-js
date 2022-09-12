import { pipe } from "fp-ts/lib/function";
import { taskEither } from "fp-ts";
import dotenv from "dotenv";
import { throwException } from "utils";
import * as Adapters from "../adapters";
import * as Repository from "../repository";
import * as Root from "./root";
import * as Env from "./env";
dotenv.config();

const readEnv = (key: string) =>
  pipe(process.env[key], (value) =>
    value == null ? throwException(`${key} is required in env`) : value,
  );

const start = pipe(
  taskEither.Do,
  taskEither.apS(
    "mongo",
    Adapters.Mongo.connect({
      url: readEnv("MONGO_URL"),
      namespace: readEnv("MONGO_NAMESPACE"),
    }),
  ),
  taskEither.apS(
    "redis",
    Adapters.Redis.connect({
      url: readEnv("REDIS_URL"),
      namespace: readEnv("REDIS_NAMESPACE"),
    }),
  ),
  taskEither.map(
    ({ mongo, redis }): Env.Env => ({
      repositories: {
        event: Repository.Event.create({ redis }),
        todo: Repository.Todo.create({ mongo }),
      },
    }),
  ),
  taskEither.match(
    (reason) => {
      console.error(reason);
      process.exit(1);
    },
    (env) => {
      Root.create(env)
        .listen({
          port:
            process.env["PORT"] == null ? 8080 : parseInt(process.env["PORT"]),
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
