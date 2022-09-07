import { describe, it } from "@jest/globals";
import * as App from "./app";

describe("app", () => {
  describe("heartbeat", () => {
    it("should return online", async () => {
      const app = App.create();
      app.inject;
    });
  });
});
