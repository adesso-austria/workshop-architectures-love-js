import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@material-tailwind/react";
import * as ReactRouter from "react-router";
import * as ReactRouterDom from "react-router-dom";
import { Routes } from "./application";
import * as Store from "./store";

const container = document.getElementById("root");

if (container == null) {
  throw new Error("excepted document to contain #root element");
}

const router = ReactRouterDom.createBrowserRouter(Routes.routes);

const root = createRoot(container);
root.render(
  <ThemeProvider>
    <Store.Provider>
      <ReactRouter.RouterProvider router={router} />
    </Store.Provider>
  </ThemeProvider>,
);
