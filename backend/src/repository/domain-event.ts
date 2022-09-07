import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Mongo from "mongodb";
import * as Redis from "redis";
import { DomainEvent } from "../domain";

export const getUnknownEvents = (
  redis: ReturnType<typeof Redis["createClient"]>,
  mongo: Mongo.MongoClient
): taskEither.TaskEither<string, DomainEvent.DomainEvent[]> =>
  pipe(
    taskEither.tryCatch(
      () =>
        mongo
          .db("todo")
          .collection<{ lastKnownEventId: string }>("log")
          .findOne({}),
      () => "some error"
    ),
    taskEither.chain(taskEither.fromNullable("not found")),
    taskEither.map((document) => document.lastKnownEventId),
    // TODO: checksum integrity check
    taskEither.chain((lastKnownEventId) =>
      taskEither.tryCatch(
        () => redis.XRANGE("log", lastKnownEventId, "+"),
        () => "some redis error"
      )
    ),
    taskEither.map((redisMessages) =>
      redisMessages.reduce((domainEvents, redisMessage) => {
        if (DomainEvent.isDomainEvent(redisMessage.message)) {
          domainEvents.push(redisMessage.message);
        }
        return domainEvents;
      }, [] as DomainEvent.DomainEvent[])
    )
  );
