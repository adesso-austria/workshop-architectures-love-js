import { ioEither, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import { ignore } from "utils";
import * as Domain from "../domain";

export enum ErrorCode {
  ECONNECT_client = "could not connect to client",
  EACCESS_lastKnownEventId = "could not access last known event id",
  EACCESS_db = "could not access db",
  ENOTFOUND_lastKnownEventId = "could not find last known event id",
  EINVALIDARG_url = "need url to know where to connect to",
  ECREATE_mongoclient = "could not create mongo client",
  EACCESS_kv = "could not access kv collection",
  EACCESS_todo = "could not access todo collection",
  EUPDATE_lastKnownEventId = "could not update last known event id",
}

type Error = [ErrorCode, unknown?];

export type Client = {
  getLastKnownEventId: () => taskEither.TaskEither<Error, string>;
  setLastKnownEventId: (id: string) => taskEither.TaskEither<Error, void>;
};

type KVEntry = { key: string; value: string };

type Db = {
  kv: Mongo.Collection<KVEntry>;
  todo: Mongo.Collection<Domain.Todo.Todo>;
};

const getLastKnownEventId =
  ({ kv }: Db): Client["getLastKnownEventId"] =>
  () =>
    pipe(
      taskEither.tryCatch(
        () => kv.findOne({ key: "lastKnownEventId" }),
        (reason): Error => [ErrorCode.EACCESS_lastKnownEventId, reason]
      ),
      taskEither.chain((doc) =>
        taskEither.tryCatch(
          async () => (doc == null ? Promise.reject() : doc.value),
          (reason): Error => [ErrorCode.ENOTFOUND_lastKnownEventId, reason]
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
      (reason): Error => [ErrorCode.EUPDATE_lastKnownEventId, reason]
    );

export const connect = (
  url = process.env["MONGO_URL"],
  db = "todo-app"
): taskEither.TaskEither<Error, Client> => {
  if (url == null) {
    return taskEither.left<Error, Client>([ErrorCode.EINVALIDARG_url]);
  }
  return pipe(
    ioEither.tryCatch(
      () => new Mongo.MongoClient(url),
      (reason): Error => [ErrorCode.ECREATE_mongoclient, reason]
    ),
    taskEither.fromIOEither,
    taskEither.chain((client) =>
      taskEither.tryCatch(
        () => client.connect(),
        (reason): Error => [ErrorCode.ECONNECT_client, reason]
      )
    ),
    taskEither.chain((client) =>
      pipe(
        ioEither.tryCatch(
          () => client.db(db),
          (reason): Error => [ErrorCode.EACCESS_db, reason]
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
            (reason): Error => [ErrorCode.EACCESS_kv, reason]
          )
        ),
        ioEither.apS(
          "todo",
          ioEither.tryCatch(
            () => db.collection<Domain.Todo.Todo>("todo"),
            (reason): Error => [ErrorCode.EACCESS_todo, reason]
          )
        ),
        taskEither.fromIOEither
      )
    ),
    taskEither.map(
      (db): Client => ({
        getLastKnownEventId: getLastKnownEventId(db),
        setLastKnownEventId: setLastKnownEventId(db),
      })
    )
  );
};
