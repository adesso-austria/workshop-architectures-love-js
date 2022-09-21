import { Adapters } from "../adapters";
import * as Event from "./event";
import * as Todo from "./todo";

export type Repository = { todo: Todo.Repository; event: Event.Repository };

export * as Event from "./event";
export * as Todo from "./todo";

export const create = (adapter: Adapters): Repository => {
  return { todo: Todo.create(adapter), event: Event.create(adapter) };
};
