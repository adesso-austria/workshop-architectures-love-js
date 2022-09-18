import { option } from "fp-ts";
import { Hateoas } from "./hateoas";

export type Todo = {
  id: option.Option<string>;
  title: string;
  content: Hateoas<string>;
};
