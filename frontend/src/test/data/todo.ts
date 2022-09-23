import * as Crypto from "crypto";
import { option } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Domain from "../../domain";

export const buyIcecream: Domain.Todo.Todo = {
  id: option.some("foo"),
  title: "Buy Icecream",
  content: option.none,
};

export const create = (
  overrides: DeepPartial<Domain.Todo.Todo>,
): Domain.Todo.Todo =>
  mergeDeepRight(
    {
      id: option.some(Crypto.randomUUID()),
      title: Crypto.randomUUID(),
      content: option.none,
    },
    overrides,
  ) as Domain.Todo.Todo;
