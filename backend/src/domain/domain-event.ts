import { TypeGuards } from "utils";
import * as Todo from "./todo";

export type DomainEvent = {
  type: "create todo";
  payload: Todo.Todo;
};

export const isDomainEvent = TypeGuards.hasKeys(["type", "payload"]) as (
  x: unknown
) => x is DomainEvent;
