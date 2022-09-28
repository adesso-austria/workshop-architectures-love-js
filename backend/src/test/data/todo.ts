import * as UUID from "uuid";
import * as Domain from "../../domain";
import * as AddTodo from "./add-todo";

export const buyIcecream: Domain.Todo.Todo = {
  id: UUID.v4(),
  isDone: false,
  ...AddTodo.buyIcecream,
};

export const buyMilk: Domain.Todo.Todo = {
  id: UUID.v4(),
  isDone: false,
  ...AddTodo.buyMild,
};

export const all = [buyIcecream];
