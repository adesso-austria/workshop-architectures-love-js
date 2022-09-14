import * as Crypto from "crypto";
import * as Contracts from "contracts";
import { FastifyPluginAsync } from "fastify";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import * as Application from "../application";
import * as Domain from "../domain";

export const fromDomain = (
  todo: Domain.Todo.Todo,
): Contracts.components["schemas"]["Todo"] => ({
  id: todo.id,
  title: todo.title,
  content: {
    href: `/todo?id=${todo.id}`,
    rel: "content",
  },
});

export const createRoutes =
  (env: Application.Env.Env): FastifyPluginAsync =>
  async (app) => {
    //////////////////////////////////////////////////////
    // GET /todo
    //////////////////////////////////////////////////////
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
          Application.Todo.getTodo(env, req.query.id),
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
            (todo) => Promise.resolve(fromDomain(todo)),
          ),
        );
        return task();
      },
    );

    app.post<{ Body: Domain.AddTodo.AddTodo }>(
      "/todo",
      {
        schema: {
          body: {
            type: "object",
            required: ["title", "content"],
            properties: {
              title: {
                type: "string",
                minLength: 1,
              },
              content: {
                type: "string",
                minLength: 1,
              },
            },
          },
        },
      },
      (req, res) => {
        const todo: Domain.Todo.Todo = {
          ...req.body,
          id: Crypto.randomUUID(),
        };

        const task = pipe(
          env.repositories.event.addEvent({
            type: "create todo",
            payload: todo,
          }),
          taskEither.map((event) => event.domainEvent.payload.id),
          taskEither.match(
            (error) => {
              res.statusCode = 500;
              console.error(error);
              res.send();
            },
            (id) => res.send(id),
          ),
        );

        task();
      },
    );
  };
