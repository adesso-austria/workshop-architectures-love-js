import { ioEither, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import { omit } from "ramda";
import * as Domain from "../domain";

export type Client = {
  todos: Mongo.Collection<Domain.Todo.Todo>;
  acknowledgedEvents: Mongo.Collection<{ consumer: string; eventId: string }>;
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
          "todos",
          ioEither.tryCatch(
            () => db.collection<Domain.Todo.Todo>("todos"),
            (reason) => reason as string,
          ),
        ),
        ioEither.apS(
          "acknowledgedEvents",
          ioEither.tryCatch(
            () =>
              db.collection<{ consumer: string; eventId: string }>(
                "acknowledgedEvents",
              ),
            (reason) => reason as string,
          ),
        ),
        taskEither.fromIOEither,
        taskEither.map((collections) => ({
          ...collections,
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
