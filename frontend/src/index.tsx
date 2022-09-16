import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@material-tailwind/react";
import { App } from "./application";
import * as Store from "./store";

const container = document.getElementById("root");

if (container == null) {
  throw new Error("excepted document to contain #root element");
}

const root = createRoot(container);
root.render(
  <ThemeProvider>
    <Store.Provider>
      <App.App />
    </Store.Provider>
  </ThemeProvider>,
);
