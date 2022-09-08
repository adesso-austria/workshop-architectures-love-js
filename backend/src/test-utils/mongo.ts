import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Repository from "../repository/mongo";

const defaultUrl = "mongodb://localhost:27017";

export const connect = (url: string = defaultUrl) =>
  pipe(
    Repository.connect({ ...(url == null ? {} : { url }), db: "testdb" }),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.map(() => client)
      )
    )
  );
