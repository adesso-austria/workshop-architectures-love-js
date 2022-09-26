import * as Crypto from "crypto";
import * as Domain from "../domain";
import * as AddTodo from "./add-todo";

export const buyIcecream: Domain.Todo.Todo = {
  id: Crypto.randomUUID(),
  isDone: false,
  ...AddTodo.buyIcecream,
};

export const buyMilk: Domain.Todo.Todo = {
  id: Crypto.randomUUID(),
  isDone: false,
  ...AddTodo.buyMild,
};

export const all = [buyIcecream];
