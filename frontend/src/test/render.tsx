import "@testing-library/jest-dom";
import resizeObserverPolyfill from "resize-observer-polyfill";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@material-tailwind/react";
import * as ReactTestRenderer from "react-test-renderer";
import * as TestingLibrary from "@testing-library/react";
import React from "react";
import * as ReactRouter from "react-router";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import { mockAnimationsApi } from "jsdom-testing-mocks";
import * as Api from "../api";
import * as Store from "../store";
import { Routes } from "../application";
import * as TestApi from "./api";
import { TestBed } from "./testbed";

globalThis.ResizeObserver = resizeObserverPolyfill;

mockAnimationsApi();

export type RenderOptions = {
  preloadedState?: DeepPartial<Store.State>;
  api?: DeepPartial<Api.Api>;
};

export const render = (
  element: JSX.Element,
  { api = {}, preloadedState = {} }: RenderOptions = {},
) => {
  const user = userEvent.setup();

  const Wrapper = ({ children }: React.PropsWithChildren) => (
    <TestBed api={api} store={preloadedState}>
      {children}
    </TestBed>
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
