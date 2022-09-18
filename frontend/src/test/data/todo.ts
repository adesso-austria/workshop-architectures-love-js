import * as Crypto from "crypto";
import { option } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Domain from "../../domain";

export const buyIcecream: Domain.Todo.Todo = {
  id: option.some("foo"),
  title: "Buy Icecream",
  content: Domain.Hateoas.pending({ href: "/todo" }),
};

export const create = (overrides: DeepPartial<Domain.Todo.Todo>) =>
  mergeDeepRight(
    {
      id: option.some(Crypto.randomUUID()),
      title: Crypto.randomUUID(),
      content: Domain.Hateoas.pending({ href: "/todo" }),
    },
    overrides,
  ) as Domain.Todo.Todo;
