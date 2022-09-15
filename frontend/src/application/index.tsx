import React from "react";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");

if (container == null) {
  throw new Error("excepted document to contain #root element");
}

const root = createRoot(container);
root.render(<div>Hello World</div>);
