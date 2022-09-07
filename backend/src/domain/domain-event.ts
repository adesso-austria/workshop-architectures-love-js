import { TypeGuards } from "utils";
import { AddTodo } from "./add-todo";

export type DomainEvent = {
  type: "create todo";
  payload: AddTodo;
};

export const isDomainEvent = TypeGuards.hasKeys(["type", "payload"]) as (
  x: unknown
) => x is DomainEvent;
