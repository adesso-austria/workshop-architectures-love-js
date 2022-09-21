import { array, either, taskEither } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import * as Domain from "../domain";
import { Env } from "./env";

export type ProcessedEvent = {
  consumer: string;
  event: Domain.Event.Event;
  result: either.Either<string, void>;
};
export type Consumer = Rx.Observable<ProcessedEvent>;

export const create = (
  env: Env,
  name: string,
  fn: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, void>,
): Consumer => {
  if (env.consumers.has(name)) {
    // since consumers are not supposed to be dynamically added during runtime, this should
    // simply prevent startup and be noticed during development.
    throw `consumer with name ${name} already exists!`;
  }
  env.consumers.add(name);

  const processEvent = (
    event: Domain.Event.Event,
  ): Rx.Observable<ProcessedEvent> => {
    const handleEvent = pipe(
      env.repositories.event.hasEventBeenAcknowledged(name, event.id),
      taskEither.chain((hasBeenAcknowledged) =>
        hasBeenAcknowledged
          ? taskEither.right(undefined)
          : pipe(
              fn(event.domainEvent),
              taskEither.chain(() =>
                env.repositories.event.acknowledgeEvent(name, event.id),
              ),
            ),
      ),
    );

    return Rx.from(handleEvent()).pipe(
      Rx.map((result) => ({ consumer: name, event, result })),
    );
  };

  const unknownEvents = pipe(
    env.repositories.event.getUnknownEvents(name),
    taskEither.map((events) => Rx.from(events)),
  );
  const newEvents = env.repositories.event.eventStream;

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

export const listConsumers = (env: Env): Readonly<string[]> =>
  Array.from(env.consumers);
