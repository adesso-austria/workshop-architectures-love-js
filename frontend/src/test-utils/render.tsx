import "@testing-library/jest-dom";
import { ThemeProvider } from "@material-tailwind/react";
import * as TestingLibrary from "@testing-library/react";
import React from "react";

export type RenderOptions = unknown;

function TestBed({ children }: React.PropsWithChildren) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

export const render = (component: JSX.Element, options: RenderOptions = {}) => {
  return TestingLibrary.render(<TestBed>{component}</TestBed>);
};
