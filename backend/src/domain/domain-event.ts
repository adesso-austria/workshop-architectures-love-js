import { TypeGuards } from "utils";
import * as Todo from "./todo";

const knownEvents = ["create todo", "delete todo", "update todo"] as const;
type EventType = typeof knownEvents[number];

type Event<Type extends EventType, Payload> = {
  type: Type;
  payload: Payload;
};

export type DomainEvent =
  | Event<"create todo", Todo.Todo>
  | Event<"delete todo", string>
  | Event<"update todo", Todo.Todo>;

export const isDomainEvent = (x: unknown): x is DomainEvent =>
  TypeGuards.hasKeys(["type", "payload"])(x) &&
  typeof x.type === "string" &&
  knownEvents.includes(x.type as EventType);
