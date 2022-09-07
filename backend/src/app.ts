import { fastify } from "fastify";

export const create = () => {
  const app = fastify();

  app.get("/_heartbeat", () => "online");

  return app;
};
