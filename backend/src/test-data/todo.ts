import * as Crypto from "crypto";
import * as Domain from "../domain";
import * as AddTodo from "./add-todo";

export const buyIcecream: Domain.Todo.Todo = {
  id: Crypto.randomUUID(),
  ...AddTodo.buyIcecream,
};

export const all = [buyIcecream];
