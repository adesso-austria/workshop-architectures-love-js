import { option } from "fp-ts";

export type AddTodo = {
  title: string;
  content: option.Option<string>;
};
