import { pipe } from "fp-ts/lib/function";
import { taskEither } from "fp-ts";
import dotenv from "dotenv";
import { throwException } from "utils";
import * as Repository from "../repository";
import * as Root from "./root";
import * as Env from "./env";
dotenv.config();

const readEnv = (key: string) =>
  pipe(process.env[key], (value) =>
    value == null ? throwException(`${key} is required in env`) : value,
  );

const start = pipe(
  Repository.connect({
    db: {
      mongo: {
        url: readEnv("MONGO_URL"),
        namespace: readEnv("MONGO_NAMESPACE"),
      },
      redis: { url: readEnv("REDIS_URL"), namespace: "" },
    },
  }),
  taskEither.match(
    (reason) => {
      console.error(reason);
      process.exit(1);
    },
    (repository) => {
      Root.create(Env.create(repository))
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
