import { describe, it, expect } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Mongo from "./mongo";

const withClient = (
  fn: (
    connectResult: taskEither.TaskEither<string, Mongo.Client>
  ) => task.Task<void>,
  url?: string,
) =>
  pipe(
    Mongo.connect({ ...(url == null ? {} : { url }), db: "test-db" }),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.map(() => client),
      ),
    ),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain((client) =>
      pipe(
        client.flush(),
        taskEither.chain(() => client.disconnect()),
      ),
    ),
  );

describe("mongo", () => {
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

  describe("flush", () => {
    it(
      "should completely drop the db",
      withClient(
        flow(
          taskEither.chain((mongo) =>
            pipe(
              mongo.flush(),
              taskEither.chain(() =>
                taskEither.tryCatch(
                  () => mongo.db.collections(),
                  () => "could not list collections",
                ),
              ),
            ),
          ),
          taskEither.match(throwException, (collections) =>
            expect(collections).toHaveLength(0),
          ),
        ),
      ),
    );
  });
});
