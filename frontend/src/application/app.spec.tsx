import React from "react";
import { act, render } from "../test/render";
import { App } from "./app";
import { Overview } from "./todo";

it("should render the todo overview", async () => {
  const result = render(<App />);
  expect(() => result.root.findByType(Overview)).not.toThrow();
  await act();
});
