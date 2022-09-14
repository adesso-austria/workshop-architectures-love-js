import * as Repository from "../repository";

/**
 * application environment
 */
export type Env = {
  repositories: {
    event: Repository.Event.Repository;
    todo: Repository.Todo.Repository;
  };
};
