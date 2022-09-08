import { option, taskEither } from "fp-ts";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import { Repository } from "../repository";
import * as Todo from "./todo";

export const defaultRepository: Repository = {
  flush: () => taskEither.right(undefined),
  event: {
    getUnknownEvents: () => taskEither.right([]),
  },
  todo: {
    addTodo: () => taskEither.right(undefined),
    getTodo: (id) => {
      const todo = Todo.all.find((todo) => todo.id === id);
      return taskEither.right(option.fromNullable(todo));
    },
    getTodos: () => taskEither.right(Todo.all),
  },
};

export const create = (overrides: DeepPartial<Repository>) =>
  mergeDeepRight(defaultRepository, overrides);
