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

globalThis.ResizeObserver = resizeObserverPolyfill;

mockAnimationsApi();

export type RenderOptions = {
  preloadedState?: DeepPartial<Store.State>;
  api?: DeepPartial<Api.Api>;
};

function TestBed({
  children,
  api,
  store,
}: React.PropsWithChildren<{ api: Api.Api; store: Store.Store }>) {
  return (
    <ThemeProvider>
      <Api.Provider api={api}>
        <Store.Provider store={store}>{children}</Store.Provider>
      </Api.Provider>
    </ThemeProvider>
  );
}

export const render = (element: JSX.Element, options: RenderOptions = {}) => {
  const mockedApi = TestApi.create(options.api ?? {});

  const mockedPreloadedState = mergeDeepRight(
    Store.initialState,
    options.preloadedState ?? {},
  ) as Store.State;

  const mockedStore = Store.create({ api: mockedApi }, mockedPreloadedState);

  const user = userEvent.setup();

  const Wrapper = ({ children }: React.PropsWithChildren) => (
    <TestBed api={mockedApi} store={mockedStore}>
      {children}
    </TestBed>
  );
  const component = ReactTestRenderer.create(<Wrapper>{element}</Wrapper>);

  const dom = TestingLibrary.render(element, { wrapper: Wrapper });
  return { ...component, ...dom, user, store: mockedStore };
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
