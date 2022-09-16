import { renderRoute } from "../test-utils";
import * as App from "./app";
import * as Todo from "./todo";

it("should render <App /> under /", () => {
  const result = renderRoute("/");
  expect(() => result.root.findByType(App.App)).not.toThrow();
});

it("should render <Todo.Overview /> under /", () => {
  const result = renderRoute("/");
  expect(() => result.root.findByType(Todo.Overview)).not.toThrow();
});
