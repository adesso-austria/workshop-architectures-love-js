import { option } from "fp-ts";
import { Identifier } from "./identifier";

export type Todo = {
  id: option.Option<string>;
  title: string;
  content: Identifier;
};
