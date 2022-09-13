import { mergeDeepRight } from "ramda";
import { DeepPartial, throwException } from "utils";
import * as Rx from "rxjs";
import * as Repository from "../../repository";

export const repository: Repository.Event.Repository = {
  addEvent: () => throwException("not implemented"),
  getEvents: () => throwException("not implemented"),
  events$: Rx.of(),
};

export const create = (
  overrides: DeepPartial<Repository.Event.Repository>,
): Repository.Event.Repository => mergeDeepRight(repository, overrides);
