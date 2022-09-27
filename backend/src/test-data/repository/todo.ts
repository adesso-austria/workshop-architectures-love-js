import { option, taskEither } from "fp-ts";
import { mergeDeepRight } from "ramda";
import { DeepPartial, throwException } from "utils";
import * as Repository from "../../repository";
import * as Todo from "../todo";

export const repository: Repository.Todo.Repository = {
  addTodo: () => throwException("not implemented"),
  getTodo: (id) => {
    const todo = Todo.all.find((todo) => todo.id === id);
    return taskEither.right(option.fromNullable(todo));
  },
  getTodos: () => taskEither.right(Todo.all),
  deleteTodo: () => taskEither.right(undefined),
  updateTodo: () => taskEither.right(undefined),
};

export const create = (
  overrides: DeepPartial<Repository.Todo.Repository>,
): Repository.Todo.Repository => mergeDeepRight(repository, overrides);
