import { option } from "fp-ts";
import * as Async from "./async";

export type Todo = {
  id: option.Option<string>;
  title: string;
  content: Async.Async<string>;
};
