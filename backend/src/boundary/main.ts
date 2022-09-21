import { fastify } from "fastify";
import * as Application from "../application";
import * as Todo from "./todo";

export const create = (env: Application.Env.Env) => {
  const processedEvents = Application.create(env);

  const server = fastify();

  server.get("/_heartbeat", () => "online");

  server.register(Todo.createRoutes(env));

  return { ...server, processedEvents };
};
