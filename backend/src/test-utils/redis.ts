import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Repository from "../repository/redis";

const defaultUrl = "redis://localhost:6379";

export const connect = (url: string = defaultUrl) =>
  pipe(
    Repository.connect({ url, db: 1 }),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.map(() => client)
      )
    )
  );
