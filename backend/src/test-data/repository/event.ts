import { mergeDeepRight } from "ramda";
import { DeepPartial, throwException, throwIfCalled } from "utils";
import * as Repository from "../../repository";

const mocked = throwIfCalled("not sensible to call on mock");

export const repository: Repository.Event.Repository = {
  addEvent: () => throwException("not implemented"),
  getEvents: () => throwException("not implemented"),
  eventStream: () => throwException("not implemented"),
  getUnknownEvents: mocked,
  acknowledgeEvent: () => throwException("not implemented"),
  hasEventBeenAcknowledged: () => throwException("not implemented"),
};

export const create = (
  overrides: DeepPartial<Repository.Event.Repository>,
): Repository.Event.Repository => mergeDeepRight(repository, overrides);
