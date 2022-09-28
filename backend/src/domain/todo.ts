import { option } from "fp-ts";

export type Todo = {
  id: string;
  title: string;
  content: option.Option<string>;
  isDone: boolean;
};
