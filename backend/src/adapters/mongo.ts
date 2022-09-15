import { ioEither, option, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import { omit } from "ramda";
import { ignore } from "utils";

export type Adapter = {
  addOne: <T extends Mongo.Document>(
    collection: string,
    item: T,
  ) => taskEither.TaskEither<string, void>;
  findOne: <T extends Mongo.Document>(
    collection: string,
    like: Mongo.Filter<T>,
  ) => taskEither.TaskEither<string, option.Option<T>>;
  findLast: <T extends Mongo.Document>(
    collection: string,
  ) => taskEither.TaskEither<string, option.Option<T>>;
  updateOne: <T extends Mongo.Document>(
    collection: string,
    like: Mongo.Filter<T>,
    next: Mongo.UpdateFilter<T>,
  ) => taskEither.TaskEither<string, void>;
  deleteOne: <T extends Mongo.Document>(
    collection: string,
    like: Mongo.Filter<T>,
  ) => taskEither.TaskEither<string, void>;
  close: () => taskEither.TaskEither<string, void>;
};

export type ConnectOptions = {
  url: string;
  namespace: string;
};

export const stripId = omit(["_id"]);

const taskify = <T>(fn: () => Promise<T>): taskEither.TaskEither<string, T> =>
  taskEither.tryCatch(fn, (reason) => reason as string);

/**
 * @internal - only exported for unit testing
 */
export type Instance = {
  client: Mongo.MongoClient;
  db: Mongo.Db;
};

const createAddOne =
  ({ db }: Instance): Adapter["addOne"] =>
  (collection, item) =>
    taskify(() =>
      db
        .collection(collection)
        .insertOne(item, { forceServerObjectId: true })
        .then(ignore),
    );

const createUpdateOne =
  ({ db }: Instance): Adapter["updateOne"] =>
  (collection, filter, next) =>
    taskify(() =>
      db.collection(collection).updateOne(filter, { $set: next }).then(ignore),
    );

const createDeleteOne =
  ({ db }: Instance): Adapter["deleteOne"] =>
  (collection, filter) =>
    taskify(() => db.collection(collection).deleteOne(filter).then(ignore));

const createFindOne = ({ db }: Instance) =>
  ((collection, like) =>
    taskify(() =>
      db
        .collection(collection)
        .findOne(like)
        .then(flow(option.fromNullable, option.map(stripId))),
    )) as Adapter["findOne"]; // assertion is necessary because Mongo id types cannot be related to T

const createFindLast = ({ db }: Instance) =>
  ((collection) =>
    taskify(() =>
      db
        .collection(collection)
        .find()
        .limit(1)
        .sort({ $natural: -1 })
        .next()
        .then(flow(option.fromNullable, option.map(stripId))),
    )) as Adapter["findLast"];

const createClose =
  ({ client }: Instance): Adapter["close"] =>
  () =>
    taskify(() => client.close());

/**
 * @internal - only exported for unit testing
 */
export const createClient = (instance: Instance): Adapter => ({
  addOne: createAddOne(instance),
  updateOne: createUpdateOne(instance),
  deleteOne: createDeleteOne(instance),
  findOne: createFindOne(instance),
  findLast: createFindLast(instance),
  close: createClose(instance),
});

/**
 * @internal - only exported for unit testing
 */
export const createInstance = ({
  url,
  namespace,
}: ConnectOptions): taskEither.TaskEither<string, Instance> =>
  pipe(
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
          (): Instance =>
            ({
              client,
              db: client.db(namespace),
            } as const),
          (reason) => `could not access db: ${reason}`,
        ),
        taskEither.fromIOEither,
      ),
    ),
  );

export const connect = (
  options: ConnectOptions,
): taskEither.TaskEither<string, Adapter> => {
  return pipe(createInstance(options), taskEither.map(createClient));
};
