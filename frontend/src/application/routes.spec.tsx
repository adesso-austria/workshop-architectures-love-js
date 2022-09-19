import * as Test from "../test";
import * as App from "./app";
import * as Todo from "./todo";

it("should render <App /> under /", async () => {
  const result = Test.renderRoute("/");
  await Test.act();
  expect(() => result.root.findByType(App.App)).not.toThrow();
});

it("should render <Todo.Overview /> under /", async () => {
  const result = Test.renderRoute("/");
  await Test.act();
  expect(() => result.root.findByType(Todo.Overview)).not.toThrow();
});
