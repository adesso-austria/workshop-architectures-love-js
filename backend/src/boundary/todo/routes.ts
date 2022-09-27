import * as Contracts from "contracts";
import { FastifyPluginAsync } from "fastify";
import { task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { JSONSchemaType } from "ajv";
import { Application } from "../../application";
import * as Mapper from "./mapper";

const schema = <T>(schema: JSONSchemaType<T>) => schema;

export const create =
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
      async function getTodo(req) {
        const processRequest = pipe(
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
            (todo) => Promise.resolve(Mapper.fromDomain(todo)),
          ),
        );
        return processRequest();
      },
    );

    //////////////////////////////////////////////////////
    // POST /todo
    //////////////////////////////////////////////////////
    app.post<{ Body: Contracts.components["schemas"]["AddTodo"] }>(
      "/todo",
      {
        schema: {
          body: schema<Contracts.components["schemas"]["AddTodo"]>({
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
      function postTodo(req, res) {
        const processRequest = pipe(
          application.todo.addTodo(req.body),
          taskEither.match(
            () => {
              res.statusCode = 500;
              res.send();
            },
            (todo) => res.send(todo.id),
          ),
        );

        processRequest();
      },
    );

    //////////////////////////////////////////////////////
    // PUT /todo
    //////////////////////////////////////////////////////
    app.put<{ Body: Contracts.components["schemas"]["UpdateTodo"] }>(
      "/todo",
      {
        schema: {
          body: schema<Contracts.components["schemas"]["UpdateTodo"]>({
            type: "object",
            required: ["id", "title", "content", "isDone"],
            properties: {
              id: {
                type: "string",
                minLength: 1,
              },
              title: {
                type: "string",
                minLength: 1,
              },
              content: {
                type: "string",
                minLength: 1,
              },
              isDone: {
                type: "boolean",
              },
            },
          }),
        },
      },
      function putTodo(req, res) {
        const processRequest = pipe(
          application.todo.updateTodo(req.body),
          taskEither.match(
            (error) =>
              match(error)
                .with("db error", () => 500)
                .with("not found", () => 404)
                .exhaustive(),
            () => 204,
          ),
          task.map((status) => {
            res.statusCode = status;
            res.send();
          }),
        );

        processRequest();
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
      function getTodoContent(req, res) {
        const processRequest = pipe(
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

        processRequest();
      },
    );

    //////////////////////////////////////////////////////
    // GET /todos
    //////////////////////////////////////////////////////
    app.get("/todos", function getTodos(_, res) {
      const processRequest = pipe(
        application.todo.getTodos(),
        taskEither.match(
          () => {
            res.statusCode = 500;
            res.send();
          },
          (todos) => res.send(todos.map(Mapper.fromDomain)),
        ),
      );

      processRequest();
    });

    //////////////////////////////////////////////////////
    // DELETE /todo
    //////////////////////////////////////////////////////
    app.delete<{ Querystring: { id: string } }>(
      "/todo",
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
      function deleteTodo(req, res) {
        const processRequest = pipe(
          application.todo.deleteTodo(req.query.id),
          taskEither.match(
            () => {
              res.statusCode = 500;
              res.send();
            },
            () => {
              res.statusCode = 204;
              res.send();
            },
          ),
        );

        processRequest();
      },
    );
  };
