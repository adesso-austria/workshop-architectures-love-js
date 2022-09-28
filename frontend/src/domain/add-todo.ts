import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";

export type AddTodo = {
  title: string;
};

export const create = (from: DeepPartial<AddTodo> = {}): AddTodo =>
  mergeDeepRight(
    {
      title: "",
    },
    from,
  );
