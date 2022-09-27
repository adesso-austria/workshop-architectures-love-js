import { fastify } from "fastify";
import { Application } from "../application";
import * as Todo from "./todo";

export * as Todo from "./todo";

export const create = (application: Application) => {
  const server = fastify();

  server.get("/_heartbeat", () => "online");

  server.register(Todo.Routes.create(application));

  return server;
};
