import { Adapters } from "../adapter";
import * as Event from "./event";
import * as Todo from "./todo";

export type Repository = { todo: Todo.Repository; event: Event.Repository };

export * as Event from "./event";
export * as Todo from "./todo";

export const create = (adapters: Adapters): Repository => {
  return { todo: Todo.create(adapters), event: Event.create(adapters) };
};
