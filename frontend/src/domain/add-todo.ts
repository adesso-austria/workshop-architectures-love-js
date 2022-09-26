import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";

export type AddTodo = {
  title: string;
  content: string;
};

export const create = (from: DeepPartial<AddTodo> = {}): AddTodo =>
  mergeDeepRight(
    {
      title: "",
      content: "",
    },
    from,
  );
