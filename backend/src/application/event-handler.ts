import { either, option, task, taskEither } from "fp-ts";
import { identity, pipe } from "fp-ts/lib/function";
import { tap } from "ramda";
import * as Rx from "rxjs";
import { ignore, throwException } from "utils";
import * as Domain from "../domain";
import * as Repository from "../repository";

export type EventHandler = (
  event: Domain.DomainEvent.DomainEvent,
) => taskEither.TaskEither<string, void>;

type ProcessedEvent = {
  event: Domain.Event.Event;
  result: either.Either<string, void>;
};

export const create = (
  repository: Repository.Repository,
  consumerId: string,
  handlerFn: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, void>,
): EventHandler => {
  const dispatchedEvents$ = repository.event.createEventStream(option.none);

  const fetchUnacknowledgedEvents = pipe(
    repository.event.getUnknownEvents(consumerId),
    taskEither.match(throwException, identity),
  );

  const unacknowledgedEvents$ = Rx.from(fetchUnacknowledgedEvents());

  const processedEvents$ = Rx.connectable(
    dispatchedEvents$.pipe(
      // buffer newly dispatched events until we know
      // which events we haven't yet acknowledged
      Rx.buffer(unacknowledgedEvents$),
      Rx.take(1),
      Rx.withLatestFrom(unacknowledgedEvents$),
      // inline events, unacknowledged first,
      // then the newly dispatched ones
      Rx.concatMap(([intermediate, unacknowledged]) =>
        Rx.concat(Rx.of(...unacknowledged, ...intermediate), dispatchedEvents$),
      ),
      Rx.concatMap((event) => {
        const processEvent = pipe(
          repository.event.hasEventBeenAcknowledged(consumerId, event.id),
          taskEither.chain((hasBeenAcknowledged) =>
            hasBeenAcknowledged
              ? taskEither.left("already known")
              : pipe(
                  handlerFn(event.domainEvent),
                  taskEither.chainFirst(() =>
                    repository.event.acknowledgeEvent(consumerId, event.id),
                  ),
                ),
          ),
          task.map((result): ProcessedEvent => ({ event, result })),
        );

        return Rx.from(processEvent());
      }),
    ),
  );
  processedEvents$.connect();

  return (domainEvent) => {
    /**
     * APPROACH TO SYNC EVENTUAL CONSISTENCY
     *
     * run the tasks for
     * - adding the domain event to the queue
     * - waiting for processing of said event
     * in parallel, abort with an error if any of them fail.
     *
     * waitForProcessing relies on adding the event and the
     * link between those two is established via eventId$
     */

    const eventId$ = new Rx.BehaviorSubject<string | undefined>(undefined);

    return pipe(
      taskEither.Do,
      taskEither.apS(
        "addEvent",
        pipe(
          repository.event.addEvent(domainEvent),
          taskEither.map(tap((event) => eventId$.next(event.id))),
        ),
      ),
      taskEither.apS("waitForProcessing", () => {
        const processed$ = processedEvents$.pipe(
          // buffer processed events until domainEvent has been added
          Rx.buffer(eventId$.pipe(Rx.filter((id) => id != null))),
          Rx.take(1),
          // inline all processed events until now with newly processed events
          Rx.concatMap((events) =>
            Rx.concat(Rx.from(events), processedEvents$),
          ),
          // wait until the processed event id equals the id of the newly created event
          Rx.filter((event) => event.event.id === eventId$.value),
          Rx.map((event) => event.result),
        );

        return Rx.firstValueFrom(processed$);
      }),
      taskEither.map(ignore),
    );
  };
};
