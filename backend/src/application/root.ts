import { fastify } from "fastify";
import { Env } from "./env";
import * as Todo from "./todo";

export const create = (env: Env) => {
  const app = fastify();

  app.get("/_heartbeat", () => "online");

  app.register(Todo.routes, env);

  return app;
};
