import { Todo } from "../repository";

/**
 * application environment
 */
export type Env = {
  repositories: {
    todo: Todo.Repository;
  };
};
