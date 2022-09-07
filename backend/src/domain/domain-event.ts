import { AddTodo } from "./add-todo";

export type DomainEvent = {
  type: "create todo";
  payload: AddTodo;
};
