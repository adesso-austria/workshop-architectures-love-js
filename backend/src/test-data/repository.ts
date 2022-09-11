import { option, taskEither } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial } from "utils";
import * as Repository from "../repository";
import * as Todo from "./todo";

export const todo: Repository.Todo.Repository = {
  addTodo: () => taskEither.right(undefined),
  getTodo: (id) => {
    const todo = Todo.all.find((todo) => todo.id === id);
    return taskEither.right(option.fromNullable(todo));
  },
  getTodos: () => taskEither.right(Todo.all),
};

export const createTodoRepository = (
  overrides: DeepPartial<Repository.Todo.Repository>,
): Repository.Todo.Repository => mergeDeepRight(todo, overrides);
