import { option, taskEither } from "fp-ts";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import { Repository } from "../repository";
import * as Todo from "./todo";

export const defaultRepository: Repository = {
  flush: () => taskEither.right(undefined),
  emit: () => taskEither.right(undefined),
  getLastKnownEventId: () => taskEither.right(option.none),
  getLastEventId: () => taskEither.right(option.none),
  setLastKnownEventId: () => taskEither.right(undefined),
  todo: {
    addTodo: () => taskEither.right(undefined),
    getTodo: (id) => {
      const todo = Todo.all.find((todo) => todo.id === id);
      return taskEither.right(option.fromNullable(todo));
    },
    getTodos: () => taskEither.right(Todo.all),
  },
  applyEvents: () => taskEither.right(undefined),
};

export const create = (overrides: DeepPartial<Repository>) =>
  mergeDeepRight(defaultRepository, overrides);
