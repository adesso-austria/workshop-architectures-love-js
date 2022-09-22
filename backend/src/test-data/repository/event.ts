import { taskEither } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Rx from "rxjs";
import * as Repository from "../../repository";
import { createMock } from "../utils";

export const create = (
  overrides: DeepPartial<Repository.Event.Repository>,
): Repository.Event.Repository => {
  return mergeDeepRight(
    createMock<Repository.Event.Repository>({
      eventStream: taskEither.right(Rx.of()),
      createEventStream: () => Rx.of(),
      getUnknownEvents: () => taskEither.right([]),
      acknowledgeEvent: () => taskEither.right(undefined),
      hasEventBeenAcknowledged: () => taskEither.right(false),
    }),
    overrides,
  );
};
