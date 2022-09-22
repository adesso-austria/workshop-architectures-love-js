import { TypeGuards } from "utils";
import * as Todo from "./todo";

type Event<Type extends string, Payload> = {
  type: Type;
  payload: Payload;
};

export type DomainEvent =
  | Event<"create todo", Todo.Todo>
  | Event<"delete todo", string>;

export const isDomainEvent = TypeGuards.hasKeys(["type", "payload"]) as (
  x: unknown,
) => x is DomainEvent;
