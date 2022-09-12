import { ioEither, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import { omit } from "ramda";
import * as Domain from "../domain";

type Collections = {
  kv: Mongo.Collection<{ key: string; value: string }>;
  todos: Mongo.Collection<Domain.Todo.Todo>;
};

export type Client = Collections & {
  disconnect: () => taskEither.TaskEither<string, void>;
};

export type ConnectOptions = {
  url: string;
  namespace: string;
};

export const stripId = omit(["_id"]);

export const connect = ({
  url,
  namespace,
}: ConnectOptions): taskEither.TaskEither<string, Client> => {
  return pipe(
    ioEither.tryCatch(
      () => new Mongo.MongoClient(url),
      (reason) => `could not create client: ${reason}`,
    ),
    taskEither.fromIOEither,
    taskEither.chain((client) =>
      taskEither.tryCatch(
        () => client.connect(),
        (reason) => `could not connect to client: ${reason}`,
      ),
    ),
    taskEither.chain((client) =>
      pipe(
        ioEither.tryCatch(
          () => [client, client.db(namespace)] as const,
          (reason) => `could not access db: ${reason}`,
        ),
        taskEither.fromIOEither,
      ),
    ),
    taskEither.chain(([client, db]) =>
      pipe(
        ioEither.Do,
        ioEither.apS(
          "kv",
          ioEither.tryCatch(
            () => db.collection<{ key: string; value: string }>("kv"),
            (reason) => `could not access kv collection: ${reason}`,
          ),
        ),
        ioEither.apS(
          "todos",
          ioEither.tryCatch(
            () => db.collection<Domain.Todo.Todo>("todo"),
            (reason) => `could not access todo collection: ${reason}`,
          ),
        ),
        taskEither.fromIOEither,
        taskEither.map((collections) => ({
          ...collections,
          db,
          disconnect: () =>
            taskEither.tryCatch(
              () => client.close(),
              (reason) => reason as string,
            ),
        })),
      ),
    ),
  );
};
