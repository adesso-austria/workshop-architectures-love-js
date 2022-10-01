import * as Contracts from "contracts";
import { FastifyPluginAsync } from "fastify";
import { option, task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { match } from "ts-pattern";
import { JSONSchemaType } from "ajv";
import { Application } from "../application";
import * as Domain from "../domain";

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
      function getTodo(req, res) {
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
              res.send({
                id: todo.id,
                title: todo.title,
                isDone: todo.isDone,
              });
            },
          ),
        );

        processRequest();
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
            required: ["title"],
            properties: {
              title: {
                type: "string",
                minLength: 1,
              },
              content: {
                type: "string",
                nullable: true,
              },
            },
          }),
        },
      },
      function postTodo(req, res) {
        const todo: Domain.AddTodo.AddTodo = {
          title: req.body.title,
          content: option.fromNullable(req.body.content),
        };

        const processRequest = pipe(
          application.todo.addTodo(todo),
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
            required: ["id", "title", "isDone"],
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
                nullable: true,
              },
              isDone: {
                type: "boolean",
              },
            },
          }),
        },
      },
      function putTodo(req, res) {
        const todo: Domain.Todo.Todo = {
          id: req.body.id,
          title: req.body.title,
          content: option.fromNullable(req.body.content),
          isDone: req.body.isDone,
        };

        const processRequest = pipe(
          application.todo.updateTodo(todo),
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
              res.send(
                pipe(
                  todo.content,
                  option.getOrElse(() => ""),
                ),
              );
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
          (todos) =>
            res.send(
              todos.map((todo): Contracts.components["schemas"]["Todo"] => ({
                id: todo.id,
                title: todo.title,
                isDone: todo.isDone,
              })),
            ),
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
            () => 500,
            () => 204,
          ),
          task.map((statusCode) => {
            res.statusCode = statusCode;
            res.send();
          }),
        );

        processRequest();
      },
    );

    app.get("/todoCount", function getTodoCount(_req, res) {
      const getTodoCount = pipe(
        application.todo.getTodoCount(),
        taskEither.match(
          (error) => {
            res.statusCode = 500;
            res.send(error);
          },
          (count) => {
            res.send(count);
          },
        ),
      );

      getTodoCount();
    });
  };
