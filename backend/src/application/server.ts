import { pipe } from "fp-ts/lib/function";
import { taskEither } from "fp-ts";
import * as Repository from "../repository";
import * as Root from "./root";
import * as Env from "./env";

const start = pipe(
  Repository.connect(),
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
    }
  )
);

start();
