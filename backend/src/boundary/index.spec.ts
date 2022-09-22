import { describe, it } from "@jest/globals";
import * as TestData from "../test-data";
import * as Boundary from "./index";

describe("app", () => {
  describe("heartbeat", () => {
    it("should return online", async () => {
      const app = Boundary.create(TestData.Application.create({}));
      const res = await app.inject({
        path: "/_heartbeat",
      });
      expect(res.body).toEqual("online");
    });
  });
});
