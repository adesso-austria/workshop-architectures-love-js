import { ioEither, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import { ignore } from "utils";
import * as Domain from "../domain";

type KVEntry = { key: string; value: string };

type Db = {
  _db: Mongo.Db;
  kv: Mongo.Collection<KVEntry>;
  todos: Mongo.Collection<Domain.Todo.Todo>;
};

export type Client = {
  flush: () => taskEither.TaskEither<string, void>;
  getLastKnownEventId: () => taskEither.TaskEither<
    string,
    option.Option<string>
  >;
  setLastKnownEventId: (id: string) => taskEither.TaskEither<string, void>;
  todos: Mongo.Collection<Domain.Todo.Todo>;
};

const flush =
  ({ _db }: Db): Client["flush"] =>
  () =>
    taskEither.tryCatch(
      () => _db.dropDatabase().then(ignore),
      (reason) => `could not drop db: ${reason}`
    );

const getLastKnownEventId =
  ({ kv }: Db): Client["getLastKnownEventId"] =>
  () =>
    pipe(
      taskEither.tryCatch(
        () =>
          kv
            .findOne({ key: "lastKnownEventId" })
            .then((doc) =>
              doc == null ? option.none : option.some(doc.value)
            ),
        (reason) => `error when searching for lastKnownEventId: ${reason}`
      )
    );

const setLastKnownEventId =
  ({ kv }: Db): Client["setLastKnownEventId"] =>
  (id) =>
    taskEither.tryCatch(
      () =>
        kv
          .updateOne(
            { key: "lastKnownEventId" },
            { $set: { value: id } },
            { upsert: true }
          )
          .then(ignore),
      (reason) => `could not update lastKnownEventId: ${reason}`
    );

export type ConnectOptions = {
  url?: string;
  db?: string;
};

export const connect = ({
  url = process.env["MONGO_URL"],
  db = "todo-app",
}: ConnectOptions = {}): taskEither.TaskEither<string, Client> => {
  if (url == null) {
    return taskEither.left<string, Client>(
      "need an url to know where to connect to"
    );
  }
  return pipe(
    ioEither.tryCatch(
      () => new Mongo.MongoClient(url),
      (reason) => `could not create client: ${reason}`
    ),
    taskEither.fromIOEither,
    taskEither.chain((client) =>
      taskEither.tryCatch(
        () => client.connect(),
        (reason) => `could not connect to client: ${reason}`
      )
    ),
    taskEither.chain((client) =>
      pipe(
        ioEither.tryCatch(
          () => client.db(db),
          (reason) => `could not access db: ${reason}`
        ),
        taskEither.fromIOEither
      )
    ),
    taskEither.chain((db) =>
      pipe(
        ioEither.Do,
        ioEither.apS(
          "kv",
          ioEither.tryCatch(
            () => db.collection<{ key: string; value: string }>("kv"),
            (reason) => `could not access kv collection: ${reason}`
          )
        ),
        ioEither.apS(
          "todos",
          ioEither.tryCatch(
            () => db.collection<Domain.Todo.Todo>("todo"),
            (reason) => `could not access todo collection: ${reason}`
          )
        ),
        taskEither.fromIOEither,
        taskEither.map((collections) => ({
          ...collections,
          _db: db,
        }))
      )
    ),
    taskEither.map(
      (db): Client => ({
        flush: flush(db),
        getLastKnownEventId: getLastKnownEventId(db),
        setLastKnownEventId: setLastKnownEventId(db),
        todos: db.todos,
      })
    )
  );
};
