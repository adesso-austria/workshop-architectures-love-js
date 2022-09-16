import { renderRoute } from "../test-utils";
import { App } from "./app";

it("should render <App /> under /", () => {
  const result = renderRoute("/");
  expect(() => result.root.findByType(App)).not.toThrow();
});
