import { array, either, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import * as Domain from "../domain";
import { Repository } from "../repository";

export type ProcessedEvent = {
  consumer: string;
  event: Domain.Event.Event;
  result: either.Either<string, void>;
};
export type Consumer = Rx.Observable<ProcessedEvent>;

export const create = (
  repository: Repository,
  name: string,
  fn: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, void>,
): Consumer => {
  const processEvent = (
    event: Domain.Event.Event,
  ): Rx.Observable<ProcessedEvent> => {
    const handleEvent = pipe(
      repository.event.hasEventBeenAcknowledged(name, event.id),
      taskEither.chain((hasBeenAcknowledged) =>
        hasBeenAcknowledged
          ? taskEither.right(undefined)
          : pipe(
              fn(event.domainEvent),
              taskEither.chain(() =>
                repository.event.acknowledgeEvent(name, event.id),
              ),
            ),
      ),
    );

    return Rx.from(handleEvent()).pipe(
      Rx.map((result) => ({ consumer: name, event, result })),
    );
  };

  const unknownEvents = pipe(
    repository.event.getUnknownEvents(name),
    taskEither.map((events) => Rx.from(events)),
  );
  const newEvents = repository.event.eventStream;

  const eventStream = Rx.forkJoin([
    Rx.from(unknownEvents()),
    Rx.from(newEvents()),
  ]).pipe(
    Rx.mergeMap(
      flow(
        array.sequence(either.Applicative),
        either.match(
          (error) => Rx.throwError(() => error),
          (stream) => Rx.concat(...stream),
        ),
      ),
    ),
  );

  return eventStream.pipe(Rx.concatMap(processEvent));
};
