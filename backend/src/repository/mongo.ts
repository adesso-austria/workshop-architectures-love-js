import { ioEither, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import { ignore } from "utils";
import * as Domain from "../domain";

export type Client = {
  flush: () => taskEither.TaskEither<string, void>;
  getLastKnownEventId: () => taskEither.TaskEither<string, string>;
  setLastKnownEventId: (id: string) => taskEither.TaskEither<string, void>;
  getTodo: (
    id: string
  ) => taskEither.TaskEither<string, option.Option<Domain.Todo.Todo>>;
  addTodo: (todo: Domain.Todo.Todo) => taskEither.TaskEither<string, void>;
};

type KVEntry = { key: string; value: string };

type Db = {
  _db: Mongo.Db;
  kv: Mongo.Collection<KVEntry>;
  todo: Mongo.Collection<Domain.Todo.Todo>;
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
        () => kv.findOne({ key: "lastKnownEventId" }),
        (reason) => `error when searching for lastKnownEventId: ${reason}`
      ),
      taskEither.chain((doc) =>
        taskEither.tryCatch(
          async () => (doc == null ? Promise.reject() : doc.value),
          (reason) => `could not find lastKnownEventId: ${reason}`
        )
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

const getTodo =
  ({ todo }: Db): Client["getTodo"] =>
  (id) =>
    taskEither.tryCatch(
      () => todo.findOne({ id }).then(option.fromNullable),
      (reason) => `error when searching for todo: ${reason}`
    );

const addTodo =
  (db: Db): Client["addTodo"] =>
  (todo) =>
    taskEither.tryCatch(
      () => db.todo.insertOne(todo).then(ignore),
      (reason) => `error when adding todo: ${reason}`
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
          "todo",
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
        getTodo: getTodo(db),
        addTodo: addTodo(db),
      })
    )
  );
};
