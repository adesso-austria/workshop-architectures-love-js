import { Repository } from "../repository";
import * as Todo from "./todo";

export * as Todo from "./todo";

export type Application = {
  todo: Todo.Application;
};

export const create = (repository: Repository): Application => {
  return {
    todo: Todo.create(repository),
  };
};
