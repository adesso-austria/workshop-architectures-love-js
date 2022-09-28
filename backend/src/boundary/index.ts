import { fastify } from "fastify";
import { Application } from "../application";
import * as Todo from "./todo";

export * as Todo from "./todo";

export const create = (application: Application) => {
  const server = fastify();

  server.setErrorHandler((error, _req, res) => {
    res.code(error.statusCode ?? 500).send(error.message);
  });

  server.get("/_heartbeat", () => "online");

  server.register(Todo.Routes.create(application));

  return server;
};
