import * as Contracts from "contracts";
import { FastifyPluginAsync } from "fastify";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { JSONSchemaType } from "ajv";
import * as Domain from "../domain";
import { Application } from "../application";

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

const schema = <T>(schema: JSONSchemaType<T>) => schema;

export const createRoutes =
  (application: Application): FastifyPluginAsync =>
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
          querystring: schema<{ id: string }>({
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "string",
              },
            },
          }),
        },
      },
      async (req) => {
        const task = pipe(
          application.todo.getTodo(req.query.id),
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

    //////////////////////////////////////////////////////
    // POST /todo
    //////////////////////////////////////////////////////
    app.post<{ Body: Domain.AddTodo.AddTodo }>(
      "/todo",
      {
        schema: {
          body: schema<{ title: string; content: string }>({
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
          }),
        },
      },
      (req, res) => {
        const task = pipe(
          application.todo.addTodo(req.body),
          taskEither.match(
            () => {
              res.statusCode = 500;
              res.send();
            },
            (todo) => res.send(todo.id),
          ),
        );

        task();
      },
    );

    //////////////////////////////////////////////////////
    // GET /todoContent
    //////////////////////////////////////////////////////
    app.get<{
      Querystring: {
        id: string;
      };
    }>(
      "/todoContent",
      {
        schema: {
          querystring: schema<{ id: string }>({
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "string",
                minLength: 1,
              },
            },
          }),
        },
      },
      (req, res) => {
        const task = pipe(
          application.todo.getTodo(req.query.id),
          taskEither.match(
            (error) => {
              res.statusCode = match(error)
                .with("db error", () => 500)
                .with("not found", () => 404)
                .exhaustive();
              res.send();
            },
            (todo) => {
              res.send(todo.content);
            },
          ),
        );

        task();
      },
    );

    //////////////////////////////////////////////////////
    // GET /todos
    //////////////////////////////////////////////////////
    app.get("/todos", (_, res) => {
      const task = pipe(
        application.todo.getTodos(),
        taskEither.match(
          () => {
            res.statusCode = 500;
            res.send();
          },
          (todos) => res.send(todos.map(fromDomain)),
        ),
      );

      task();
    });
  };
