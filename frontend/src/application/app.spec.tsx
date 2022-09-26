import React from "react";
import * as ReactRouter from "react-router";
import { render } from "../test/render";
import { App } from "./app";

it("should render a router outlet", () => {
  const result = render(<App />);
  expect(() => result.root.findByType(ReactRouter.Outlet)).not.toThrow();
});
