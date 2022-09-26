import React from "react";
import * as ReactRouter from "react-router";
import * as App from "./app";
import * as Todo from "./todo";

export const routes: ReactRouter.RouteObject[] = [
  {
    path: "/",
    element: <App.App />,
    children: [
      {
        index: true,
        element: <Todo.Overview />,
      },
    ],
  },
];
