import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";
import * as Mongo from "./mongo";
import * as Redis from "./redis";
import * as Todo from "./todo";

export type Env = {
  mongo: Mongo.Client;
  redis: Redis.Client;
};

export type Repository = {
  todo: Todo.Repository;
  applyEvents: (
    events: Domain.DomainEvent.DomainEvent[]
  ) => taskEither.TaskEither<string, void>;
};

export const connect = ({
  redis: redisOptions = {},
  mongo: mongoOptions = {},
}: {
  redis?: Redis.ConnectOptions;
  mongo?: Mongo.ConnectOptions;
} = {}): taskEither.TaskEither<string, Repository> =>
  pipe(
    taskEither.Do,
    taskEither.apS("redis", Redis.connect(redisOptions)),
    taskEither.apS(
      "mongo",
      pipe(
        Mongo.connect(mongoOptions),
        taskEither.mapLeft(([error, reason]) => `${error}: ${reason}`)
      )
    ),
    taskEither.map(
      (env): Repository => ({
        todo: Todo.create(env),
        applyEvents: () => taskEither.left("not implemented"),
      })
    )
  );
