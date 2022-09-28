import * as Test from "../test";
import * as Boundary from "./index";

describe("app", () => {
  describe("heartbeat", () => {
    it("should return online", async () => {
      const app = Boundary.create(Test.Application.create({}));
      const res = await app.inject({
        path: "/_heartbeat",
      });
      expect(res.body).toEqual("online");
    });
  });
});
