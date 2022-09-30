import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@material-tailwind/react";
import * as Api from "./api";
import * as Store from "./store";
import { App } from "./components";

const container = document.getElementById("root");

if (container == null) {
  throw new Error("excepted document to contain #root element");
}

const root = createRoot(container);

root.render(
  <ThemeProvider>
    <Api.Provider>
      <Store.Provider>
        <App.App />
      </Store.Provider>
    </Api.Provider>
  </ThemeProvider>,
);
