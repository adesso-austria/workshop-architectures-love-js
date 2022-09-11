import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { ignore, throwException } from "utils";
import * as Domain from "../domain";
import { Redis } from "../adapters";

export type Repository = {
  /**
   * emit a new domain event
   */
  emit: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, string>;
  /**
   * subscribe to domain events.
   * @param subscriber callback that gets passed events since `since`
   * @param since emit all events since this id. If nothing is supplied all events will be emitted
   */
  subscribe: (
    subscriber: (event: Domain.DomainEvent.DomainEvent) => void,
    since?: string,
  ) => { unsubscribe: () => void };
};

const serializeEvent = (event: Domain.DomainEvent.DomainEvent) => ({
  type: event.type,
  payload: JSON.stringify(event.payload),
});

const deserializeEvent = (
  message: Record<string, string | Buffer>,
): Domain.DomainEvent.DomainEvent => {
  const parsed = JSON.parse(message["payload"]?.toString() ?? "");
  return {
    type: message["type"],
    payload: parsed,
  } as Domain.DomainEvent.DomainEvent;
};

export const create = (redis: Redis.Client): Repository => ({
  emit: (event) => redis.addEvent(serializeEvent(event)),
  subscribe: () => throwException("not implemented"),
});
