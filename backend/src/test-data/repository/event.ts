import * as Crypto from "crypto";
import { either, taskEither } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Rx from "rxjs";
import * as Domain from "../../domain";
import * as Repository from "../../repository";
import { createMock } from "../utils";

export const create = (
  overrides: DeepPartial<Repository.Event.Repository>,
): Repository.Event.Repository => {
  const events$ = new Rx.Subject<Domain.Event.Event>();
  const ackEvents = [] as Array<{ consumer: string; eventId: string }>;

  return mergeDeepRight(
    createMock<Repository.Event.Repository>({
      addEvent: (domainEvent) => async () => {
        const event: Domain.Event.Event = {
          id: Crypto.randomUUID(),
          domainEvent,
        };
        events$.next(event);
        return either.right(event);
      },
      createEventStream: () => events$,
      getUnknownEvents: () => taskEither.right([]),
      acknowledgeEvent: (consumer, eventId) => {
        ackEvents.push({ consumer, eventId });
        return taskEither.right(undefined);
      },
      hasEventBeenAcknowledged: (consumer, eventId) =>
        taskEither.right(
          ackEvents.some(
            (event) => event.consumer === consumer && event.eventId === eventId,
          ),
        ),
    }),
    overrides,
  );
};
