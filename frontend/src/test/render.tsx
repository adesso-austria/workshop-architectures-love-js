import "@testing-library/jest-dom";
import resizeObserverPolyfill from "resize-observer-polyfill";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@material-tailwind/react";
import * as ReactTestRenderer from "react-test-renderer";
import * as TestingLibrary from "@testing-library/react";
import React from "react";
import * as ReactRouter from "react-router";
import * as Store from "../store";
import { Routes } from "../application";

globalThis.ResizeObserver = resizeObserverPolyfill;

export type RenderOptions = { preloadedState?: Store.State };

function TestBed({
  children,
  preloadedState,
}: React.PropsWithChildren<RenderOptions>) {
  return (
    <ThemeProvider>
      <Store.Provider preloadedState={preloadedState}>
        {children}
      </Store.Provider>
    </ThemeProvider>
  );
}

export const render = (element: JSX.Element, options: RenderOptions = {}) => {
  const user = userEvent.setup();
  const Wrapper = ({ children }: React.PropsWithChildren) => (
    <TestBed {...options}>{children}</TestBed>
  );
  const component = ReactTestRenderer.create(<Wrapper>{element}</Wrapper>);

  const dom = TestingLibrary.render(element, { wrapper: Wrapper });
  return { ...component, ...dom, user };
};

export const renderRoute = (route: string) => {
  const router = ReactRouter.createMemoryRouter(Routes.routes, {
    initialEntries: [route],
  });
  return render(<ReactRouter.RouterProvider router={router} />);
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const act = async (fn: () => Promise<void> = async () => {}) =>
  await TestingLibrary.act(fn);
