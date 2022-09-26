import { option } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as UUID from "uuid";
import * as Domain from "../../domain";

export const buyIcecream: Domain.Todo.Todo = {
  id: option.some("foo"),
  title: "Buy Icecream",
  content: option.none,
  isDone: option.none,
};

export const create = (
  overrides: DeepPartial<Domain.Todo.Todo>,
): Domain.Todo.Todo =>
  mergeDeepRight(
    {
      id: option.some(UUID.v4()),
      title: "some title",
      content: option.none,
    },
    overrides,
  ) as Domain.Todo.Todo;
