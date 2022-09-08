import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { DomainEvent } from "../domain";
import type { Env } from "./root";

export const getUnknownEvents = ({
  redis,
  mongo,
}: Env): taskEither.TaskEither<string, DomainEvent.DomainEvent[]> =>
  pipe(
    mongo.getLastKnownEventId(),
    taskEither.mapLeft(([error, reason]) => `${error}: ${reason}`),
    taskEither.chain((id) => redis.getEventsSince(id)),
    taskEither.map((messages) =>
      messages.reduce((events, message) => {
        if (DomainEvent.isDomainEvent(message.message)) {
          events.push(message.message);
        }
        return events;
      }, [] as DomainEvent.DomainEvent[])
    )
  );
