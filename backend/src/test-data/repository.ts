import { option, taskEither } from "fp-ts";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import { Repository } from "../repository";
import * as Todo from "./todo";

export const defaultRepository: Repository = {
  todo: {
    getTodo: (id) => {
      const todo = Todo.all.find((todo) => todo.id === id);
      return taskEither.right(option.fromNullable(todo));
    },
    getTodos: () => taskEither.right(Todo.all),
  },
};

export const create = (overrides: DeepPartial<Repository>) =>
  mergeDeepRight(defaultRepository, overrides);
