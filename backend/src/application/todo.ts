import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import * as Repository from "../repository";
import * as Domain from "../domain";
import { Env } from "./env";

//////////////////////////////////////////////////////
// WRITE MODEL
//////////////////////////////////////////////////////

export const createEventHandler =
  ({ repositories: { todo } }: Env) =>
  (event: Domain.Event.Event): taskEither.TaskEither<string, void> => {
    return pipe(
      // maybe we care about this event, maybe we don't
      match(event.domainEvent)
        .with({ type: "create todo" }, ({ payload }) =>
          option.some(todo.addTodo(payload)),
        )
        .otherwise(() => option.none),
      // if we care but already know this event we ignore it, otherwise we proceed as planned
      option.map((task) =>
        pipe(
          todo.hasEventBeenLogged(event),
          taskEither.chain((hasBeenLogged) =>
            hasBeenLogged ? taskEither.of(undefined) : task,
          ),
        ),
      ),
      // but at any rate it's important to indicate that the event has been processed
      option.getOrElse(() => taskEither.of<string, void>(undefined)),
    );
  };

//////////////////////////////////////////////////////
// READ MODEL
//////////////////////////////////////////////////////

export const getTodo = (
  env: Env,
  id: string,
): taskEither.TaskEither<"db error" | "not found", Domain.Todo.Todo> =>
  pipe(
    env.repositories.todo.getTodo(id),
    taskEither.mapLeft(() => "db error" as const),
    taskEither.chain(
      option.match(
        (): ReturnType<typeof getTodo> => taskEither.left("not found"),
        taskEither.of,
      ),
    ),
  );
