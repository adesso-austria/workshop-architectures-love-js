import { demoize } from "demoize";
import React from "react";
import { App } from "./app";

demoize("app", () => {
  return <App />;
});
