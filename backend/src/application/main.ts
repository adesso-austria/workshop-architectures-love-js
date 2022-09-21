import * as Rx from "rxjs";
import * as Env from "./env";
import * as Todo from "./todo";

export const create = (env: Env.Env) => {
  const todoConsumer = Todo.createConsumer(env);

  /**
   * aggregate an array of consumers into a single stream of processed events
   */
  return Rx.merge(todoConsumer).pipe(Rx.share());
};
