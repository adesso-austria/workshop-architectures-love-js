import { fastify } from "fastify";
import * as Application from "../application";
import * as Todo from "./todo";

export const create = (env: Application.Env.Env) => {
  const app = fastify();

  app.get("/_heartbeat", () => "online");

  app.register(Todo.createRoutes(env));

  return app;
};
