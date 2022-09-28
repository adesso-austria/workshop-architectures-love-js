import React from "react";
import { NewTodo, Overview } from "./todo";

export const App = function App() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="p-4 text-center text-4xl">EO-TODO</h1>
      <hr className="mb-2" />
      <NewTodo />
      <hr className="mb-4" />
      <Overview />
    </div>
  );
};
