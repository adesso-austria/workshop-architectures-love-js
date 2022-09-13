import { ioEither, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import { omit } from "ramda";
import * as Domain from "../domain";

/**
 * Represents a collection of T with tracked events that led to the current state
 */
type Consumer<T extends Mongo.Document> = {
  collection: Mongo.Collection<T>;
  events: Mongo.Collection<Domain.Event.Event>;
};

const createConsumer = <T extends Mongo.Document>(
  db: Mongo.Db,
  key: string,
): ioEither.IOEither<string, Consumer<T>> =>
  pipe(
    ioEither.Do,
    ioEither.apS(
      "collection",
      ioEither.tryCatch(
        () => db.collection<T>(key),
        (reason) => `could not create collection ${key}: ${reason}`,
      ),
    ),
    ioEither.apS(
      "events",
      ioEither.tryCatch(
        () => db.collection<Domain.Event.Event>(`${key}Events`),
        (reason) => `could not create events collection for ${key}: ${reason}`,
      ),
    ),
  );

export type Client = {
  todos: Consumer<Domain.Todo.Todo>;
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
        ioEither.apS("todos", createConsumer<Domain.Todo.Todo>(db, "todos")),
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
