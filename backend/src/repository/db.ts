import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";
import * as Mongo from "./mongo";
import * as Redis from "./redis";

type Clients = {
  mongo: Mongo.Client;
  redis: Redis.Client;
};

export type Db = Clients & {
  getUnknownEvents: () => taskEither.TaskEither<
    string,
    Domain.DomainEvent.DomainEvent[]
  >;
};

export type ConnectOptions = {
  redis?: Redis.ConnectOptions;
  mongo?: Mongo.ConnectOptions;
};

const getUnknownEvents =
  ({
    redis,
    mongo,
  }: Clients): (() => taskEither.TaskEither<
    string,
    Domain.DomainEvent.DomainEvent[]
  >) =>
  () =>
    pipe(
      mongo.getLastKnownEventId(),
      taskEither.chain((id) => redis.getEventsSince(id)),
      taskEither.map((messages) =>
        messages.reduce((events, message) => {
          if (Domain.DomainEvent.isDomainEvent(message.message)) {
            events.push(message.message);
          }
          return events;
        }, [] as Domain.DomainEvent.DomainEvent[])
      )
    );

export const connect = ({
  redis: redisOptions = {},
  mongo: mongoOptions = {},
}: ConnectOptions = {}): taskEither.TaskEither<string, Db> =>
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
    taskEither.map((clients) => ({
      ...clients,
      getUnknownEvents: getUnknownEvents(clients),
    }))
  );
