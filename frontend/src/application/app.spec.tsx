import React from "react";
import { render } from "../test-utils";
import { App } from "./app";

it("should render Hello World", () => {
  const result = render(<App />);
  expect(result).toHaveTextContent("Hello World");
});
