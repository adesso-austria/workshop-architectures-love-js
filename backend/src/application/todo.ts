import { FastifyPluginAsync, FastifyPluginCallback } from "fastify";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { Todo } from "../repository";
import * as Boundary from "../boundary";
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
  repository: Todo.Repository,
  id: string,
): taskEither.TaskEither<"db error" | "not found", Domain.Todo.Todo> =>
  pipe(
    repository.getTodo(id),
    taskEither.mapLeft(() => "db error" as const),
    taskEither.chain(
      option.match(
        (): ReturnType<typeof getTodo> => taskEither.left("not found"),
        taskEither.of,
      ),
    ),
  );

export const createRoutes =
  (env: Env): FastifyPluginAsync =>
  async (app) => {
    app.get<{
      Querystring: {
        id: string;
      };
    }>(
      "/todo",
      {
        schema: {
          querystring: {
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "string",
              },
            },
          },
        },
      },
      async (req) => {
        const task = pipe(
          getTodo(env.repositories.todo, req.query.id),
          taskEither.match(
            (error) =>
              match(error)
                .with("db error", () =>
                  Promise.reject({
                    status: 500,
                    message: "internal server error",
                  }),
                )
                .with("not found", () =>
                  Promise.reject({
                    status: 404,
                    message: `no todo with id ${req.query.id} exists`,
                  }),
                )
                .exhaustive(),
            (todo) => Promise.resolve(Boundary.Todo.fromDomain(todo)),
          ),
        );
        return task();
      },
    );
  };
