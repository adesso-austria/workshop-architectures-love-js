import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Rx from "rxjs";
import { Application } from "../../application/todo";
import { createMock } from "../utils";

export const create = (overrides: DeepPartial<Application>): Application =>
  mergeDeepRight(
    createMock<Application>({
      consumer: Rx.of(),
    }),
    overrides,
  );
