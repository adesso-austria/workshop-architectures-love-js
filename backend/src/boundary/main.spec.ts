import { describe, it } from "@jest/globals";
import * as TestData from "../test-data";
import * as Main from "./main";

describe("app", () => {
  describe("heartbeat", () => {
    it("should return online", async () => {
      const app = Main.create(TestData.Env.create({}));
      const res = await app.inject({
        path: "/_heartbeat",
      });
      expect(res.body).toEqual("online");
    });
  });
});
