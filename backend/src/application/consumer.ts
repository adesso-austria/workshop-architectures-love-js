import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";
import { Env } from "./env";

const existingConsumers = new Set<string>();

type Consumer = (
  event: Domain.Event.Event,
) => taskEither.TaskEither<string, void>;

export const create = (
  env: Env,
  name: string,
  fn: (
    event: Domain.DomainEvent.DomainEvent,
  ) => taskEither.TaskEither<string, void>,
): Consumer => {
  if (existingConsumers.has(name)) {
    throw new Error(`consumer with name ${name} alread exists!`);
  }
  existingConsumers.add(name);
  return (event) =>
    pipe(
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
};
