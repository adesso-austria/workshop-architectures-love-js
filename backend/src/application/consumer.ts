import { either, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Rx from "rxjs";
import * as Domain from "../domain";
import { Env } from "./env";

const existingConsumers = new Set<string>();

export type ProcessedEvent = {
  consumer: string;
  event: Domain.Event.Event;
  result: either.Either<string, void>;
};
export type Consumer = taskEither.TaskEither<
  string,
  Rx.Observable<ProcessedEvent>
>;

export const create = (
  env: Env,
  name: string,
  fn: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, void>,
): Consumer => {
  if (existingConsumers.has(name)) {
    return taskEither.left(`consumer with name ${name} alread exists!`);
  }
  existingConsumers.add(name);

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

  /**
   * fetch unknown events and start listening for new events
   */
  const createEventStream = pipe(
    taskEither.Do,
    taskEither.apS(
      "unknownEvents",
      env.repositories.event.getUnknownEvents(name),
    ),
    taskEither.apS("eventStream", env.repositories.event.eventStream),
    taskEither.map(({ unknownEvents, eventStream }) =>
      Rx.concat(Rx.of(...unknownEvents), eventStream),
    ),
  );

  return pipe(
    createEventStream,
    taskEither.map((events$) => events$.pipe(Rx.concatMap(processEvent))),
  );
};
