import { option } from "fp-ts";
import { Async } from "./async";

export type Todo = {
  id: option.Option<string>;
  title: string;
  content: Async<string, "fetching" | "updating">;
  isDone: Async<boolean, "fetching" | "updating">;
};
