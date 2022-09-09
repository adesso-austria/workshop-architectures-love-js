import * as Crypto from "crypto";
import { ioEither, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import { omit } from "ramda";
import * as Domain from "../domain";

type KVEntry = { key: string; value: string };

type Collections = {
  kv: Mongo.Collection<KVEntry>;
  todos: Mongo.Collection<Domain.Todo.Todo>;
  db: Mongo.Db;
};

export type Client = Collections & {
  disconnect: () => taskEither.TaskEither<string, void>;
};

export const stripMongoId = <T, Doc extends Mongo.WithId<T>>(document: Doc) =>
  omit(["_id"], document) as T;

export type ConnectOptions = {
  url?: string;
  db?: string;
};

export const connect = ({
  url = process.env["MONGO_URL"],
  db = Crypto.randomUUID(),
}: ConnectOptions = {}): taskEither.TaskEither<string, Client> => {
  if (url == null) {
    return taskEither.left<string, Client>(
      "need an url to know where to connect to",
    );
  }
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
          () => [client, client.db(db)] as const,
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
