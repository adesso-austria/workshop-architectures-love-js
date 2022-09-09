import { describe, it } from "@jest/globals";
import { task, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as TestUtils from "../test-utils";
import * as Mongo from "./mongo";

const withClient = (
  fn: (
    connectResult: taskEither.TaskEither<string, Mongo.Client>
  ) => task.Task<void>,
  url?: string,
) =>
  pipe(
    Mongo.connect(
      TestUtils.Repository.createConnectOptions({
        db: { mongo: url == null ? {} : { url } },
      }).db.mongo,
    ),
    task.chainFirst(flow(taskEither.fromEither, fn)),
    taskEither.chain((client) => client.disconnect()),
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
});
