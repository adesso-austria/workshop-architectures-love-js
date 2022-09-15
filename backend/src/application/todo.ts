import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import * as Domain from "../domain";
import { Env } from "./env";
import * as Consumer from "./consumer";

//////////////////////////////////////////////////////
// WRITE MODEL
//////////////////////////////////////////////////////

export const createConsumer = (env: Env) =>
  Consumer.create(env, "todo", (event) =>
    pipe(
      match(event)
        .with({ type: "create todo" }, ({ payload }) =>
          env.repositories.todo.addTodo(payload),
        )
        .otherwise(() => taskEither.right(undefined)),
    ),
  );

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
