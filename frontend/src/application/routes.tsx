import React from "react";
import * as ReactRouter from "react-router";
import { App } from "./app";

export const routes: ReactRouter.RouteObject[] = [
  {
    path: "/",
    element: <App />,
  },
];
