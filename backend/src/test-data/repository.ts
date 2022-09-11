import { option, taskEither } from "fp-ts";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import * as Rx from "rxjs";
import { Repository } from "../repository";
import * as Todo from "./todo";

export const defaultRepository: Repository = {
  disconnect: () => taskEither.right(undefined),
  event: {
    syncState: () => taskEither.right(undefined),
    events$: Rx.of(),
    emit: () =>
      taskEither.left("emitting events on mock repository isn't sensible"),
  },
  todo: {
    applyEvent: () => taskEither.right(undefined),
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
