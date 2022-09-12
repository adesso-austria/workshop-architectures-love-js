import { Event, Todo } from "../repository";

/**
 * application environment
 */
export type Env = {
  repositories: {
    event: Event.Repository;
    todo: Todo.Repository;
  };
};
