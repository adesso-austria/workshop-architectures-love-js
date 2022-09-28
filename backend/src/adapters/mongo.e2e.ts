import * as Crypto from "crypto";
import { option, task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Mongo from "./mongo";

const taskify = <T>(fn: () => Promise<T>): taskEither.TaskEither<string, T> =>
  taskEither.tryCatch(fn, (reason) => reason as string);

const withClient = (
  fn: (
    connectResult: taskEither.TaskEither<
      string,
      { instance: Mongo.Instance; client: Mongo.Adapter }
    >,
  ) => task.Task<void>,
  url = "mongodb://localhost:27017",
) =>
  pipe(
    Mongo.createInstance({
      url,
      namespace: Crypto.randomUUID(),
    }),
    taskEither.map((instance) => ({
      instance,
      client: Mongo.createClient(instance),
    })),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain(({ client }) => client.close()),
  );

describe("connect", () => {
  it(
    "should return left when given an invalid url",
    withClient(
      taskEither.match(ignore, () => throwException("expected a left")),
      "foo",
    ),
  );

  it(
    "should return right when connection to db succeeds",
    withClient(taskEither.match(throwException, ignore)),
  );
});

describe("addOne", () => {
  it(
    "should add a document",
    withClient(
      flow(
        taskEither.chainFirst(({ client }) =>
          client.addOne("foo", { bar: "baz" }),
        ),
        taskEither.chain(({ instance }) =>
          taskify(() => instance.db.collection("foo").findOne({ bar: "baz" })),
        ),
        taskEither.match(throwException, (doc) => expect(doc).toBeDefined()),
      ),
    ),
  );
});

describe("findOne", () => {
  it(
    "should find an existing document",
    withClient(
      flow(
        taskEither.chainFirst(({ instance }) =>
          taskify(() =>
            instance.db.collection("foo").insertOne({ bar: "baz" }),
          ),
        ),
        taskEither.chain(({ client }) => client.findOne("foo", { bar: "baz" })),
        taskEither.match(throwException, (doc) =>
          expect(doc).toEqual(option.some({ bar: "baz" })),
        ),
      ),
    ),
  );
});

describe("findAll", () => {
  it(
    "should return all documents if unfiltered",
    withClient(
      flow(
        taskEither.chainFirst(({ instance }) =>
          taskify(() =>
            instance.db
              .collection("foo")
              .insertMany([{ a: 1 }, { b: 2 }, { c: 3 }]),
          ),
        ),
        taskEither.chain(({ client }) => client.findAll("foo", {})),
        taskEither.match(throwException, (docs) =>
          expect(docs).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]),
        ),
      ),
    ),
  );

  it(
    "should return all matching document if filtered",
    withClient(
      flow(
        taskEither.chainFirst(({ instance }) =>
          taskify(() =>
            instance.db
              .collection("foo")
              .insertMany([{ a: 1 }, { b: 2 }, { c: 3 }]),
          ),
        ),
        taskEither.chain(({ client }) => client.findAll("foo", { b: 2 })),
        taskEither.match(throwException, (docs) =>
          expect(docs).toEqual([{ b: 2 }]),
        ),
      ),
    ),
  );
});

describe("findLast", () => {
  it(
    "should return the latest added document",
    withClient(
      flow(
        taskEither.chainFirst(({ instance }) =>
          taskify(() =>
            instance.db
              .collection("foo")
              .insertMany([{ a: 1 }, { b: 2 }, { c: 3 }], {
                forceServerObjectId: true,
              }),
          ),
        ),
        taskEither.chain(({ client }) => client.findLast("foo")),
        taskEither.match(throwException, (last) =>
          expect(last).toEqual(option.some({ c: 3 })),
        ),
      ),
    ),
  );

  it(
    "should return the latest added document that looks like X",
    withClient(
      flow(
        taskEither.chainFirst(({ instance }) =>
          taskify(() =>
            instance.db.collection("foo").insertMany(
              [
                { type: "bar", value: 1 },
                { type: "bar", value: 2 },
                { type: "baz", value: 1000 },
              ],
              {
                forceServerObjectId: true,
              },
            ),
          ),
        ),
        taskEither.chain(({ client }) =>
          client.findLast("foo", { type: "bar" }),
        ),
        taskEither.match(throwException, (last) =>
          expect(last).toEqual(option.some({ type: "bar", value: 2 })),
        ),
      ),
    ),
  );
});

describe("deleteOne", () => {
  it(
    "should remove a document",
    withClient(
      flow(
        taskEither.chainFirst(({ instance }) =>
          taskify(() =>
            instance.db.collection("foo").insertOne({ bar: "baz" }),
          ),
        ),
        taskEither.chainFirst(({ client }) =>
          client.deleteOne("foo", { bar: "baz" }),
        ),
        taskEither.chain(({ instance }) =>
          taskify(() => instance.db.collection("foo").findOne({ bar: "baz" })),
        ),
        taskEither.match(throwException, (doc) => expect(doc).toBeNull()),
      ),
    ),
  );
});

describe("updateOne", () => {
  it(
    "should update an existing document",
    withClient(
      flow(
        taskEither.chainFirst(({ instance }) =>
          taskify(() =>
            instance.db.collection("foo").insertOne({ bar: "baz" }),
          ),
        ),
        taskEither.chainFirst(({ client }) =>
          client.updateOne("foo", { bar: "baz" }, { bar: "qux" }),
        ),
        taskEither.chain(({ instance }) =>
          taskify(() => instance.db.collection("foo").findOne()),
        ),
        taskEither.match(throwException, (doc) =>
          expect(doc).toMatchObject({ bar: "qux" }),
        ),
      ),
    ),
  );

  it(
    "should throw if the requested document can't be found",
    withClient(
      flow(
        taskEither.chain(({ client }) =>
          client.updateOne("foo", { bar: "baz" }, { bar: "qux" }),
        ),
        taskEither.match(ignore, () => throwException("expected a left")),
      ),
    ),
  );
});
