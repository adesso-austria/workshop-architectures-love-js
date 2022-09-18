import { option } from "fp-ts";
import * as Hateoas from "./hateoas";

export type Todo = {
  id: option.Option<string>;
  title: string;
  content: Hateoas.Hateoas<string>;
};
