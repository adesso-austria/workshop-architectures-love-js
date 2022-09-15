import { mergeDeepRight } from "ramda";
import { DeepPartial, throwException } from "utils";
import * as Repository from "../../repository";

export const repository: Repository.Event.Repository = {
  addEvent: () => throwException("not implemented"),
  getEvents: () => throwException("not implemented"),
  eventStream: () => throwException("not implemented"),
  acknowledgeEvent: () => throwException("not implemented"),
  hasEventBeenAcknowledged: () => throwException("not implemented"),
};

export const create = (
  overrides: DeepPartial<Repository.Event.Repository>,
): Repository.Event.Repository => mergeDeepRight(repository, overrides);
