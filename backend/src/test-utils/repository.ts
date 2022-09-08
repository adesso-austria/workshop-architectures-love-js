import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { mergeDeepRight } from "ramda";
import * as Repository from "../repository";

export const connect = (options: Repository.ConnectOptions = {}) =>
  pipe(
    Repository.connect(
      mergeDeepRight(options, {
        db: { mongo: { db: "test" }, redis: { db: 1 } },
      })
    ),
    taskEither.chain((repository) =>
      pipe(
        repository.flush(),
        taskEither.map(() => repository)
      )
    )
  );
