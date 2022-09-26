import { option } from "fp-ts";

export type Todo = {
  id: option.Option<string>;
  title: string;
  content: option.Option<string>;
  isDone: option.Option<boolean>;
};
