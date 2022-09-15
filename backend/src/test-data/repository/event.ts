import { taskEither } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial, throwIfCalled } from "utils";
import * as Rx from "rxjs";
import * as Repository from "../../repository";

const mocked = throwIfCalled("not sensible to call on mock");

export const repository: Repository.Event.Repository = {
  addEvent: mocked,
  getEvents: mocked,
  eventStream: taskEither.right(Rx.of()),
  getUnknownEvents: () => taskEither.right([]),
  acknowledgeEvent: () => taskEither.right(undefined),
  hasEventBeenAcknowledged: () => taskEither.right(false),
};

export const create = (
  overrides: DeepPartial<Repository.Event.Repository>,
): Repository.Event.Repository => mergeDeepRight(repository, overrides);
