import { describe, it } from "@jest/globals";
import * as TestData from "../test-data";
import * as Root from "./root";

describe("app", () => {
  describe("heartbeat", () => {
    it("should return online", async () => {
      const app = Root.create(TestData.Env.defaultEnv);
      app.inject;
    });
  });
});
