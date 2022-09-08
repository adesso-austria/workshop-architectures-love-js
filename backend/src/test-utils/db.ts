import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Db from "../repository/db";

export const connect = (): taskEither.TaskEither<string, Db.Db> =>
  pipe(
    Db.connect(),
    taskEither.chain((db) =>
      pipe(
        taskEither.Do,
        taskEither.apS("redis", db.redis.flush()),
        taskEither.apS(
          "mongo",
          pipe(
            db.mongo.flush(),
            taskEither.mapLeft(([error, reason]) => `${error}: ${reason}`)
          )
        ),
        taskEither.map(() => db)
      )
    )
  );
