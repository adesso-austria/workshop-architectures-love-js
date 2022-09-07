import { FastifyPluginCallback } from "fastify";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { Repository } from "../repository";
import * as Domain from "../domain";
import { Env } from "./env";

export const getTodo = (
  repository: Repository,
  id: string
): taskEither.TaskEither<"db error" | "not found", Domain.Todo.Todo> =>
  pipe(
    repository.todo.getTodo(id),
    taskEither.mapLeft(() => "db error" as const),
    taskEither.chain(
      option.match(
        (): ReturnType<typeof getTodo> => taskEither.left("not found"),
        taskEither.of
      )
    )
  );

export const routes: FastifyPluginCallback<Env> = async (app, options) => {
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
        getTodo(options.repository, req.query.id),
        taskEither.match(
          (error) =>
            match(error)
              .with("db error", () =>
                Promise.reject({
                  status: 500,
                  message: "internal server error",
                })
              )
              .with("not found", () =>
                Promise.reject({
                  status: 404,
                  message: `no todo with id ${req.query.id} exists`,
                })
              )
              .exhaustive(),
          (todo) => Promise.resolve(todo)
        )
      );
      return task();
    }
  );
};
