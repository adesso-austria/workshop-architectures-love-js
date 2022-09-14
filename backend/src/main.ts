import dotenv from "dotenv";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Boundary from "./boundary";
import * as Application from "./application";

dotenv.config();

export const start = pipe(
  Application.Env.loadEnv(process.env),
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
