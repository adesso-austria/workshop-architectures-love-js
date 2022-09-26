import { ThemeProvider } from "@material-tailwind/react";
import React from "react";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import * as Api from "../api";
import * as Store from "../store";
import * as TestApi from "./api";

export function TestBed({
  children,
  api,
  store,
}: React.PropsWithChildren<{
  api: DeepPartial<Api.Api>;
  store: DeepPartial<Store.State>;
}>) {
  const mockedApi = TestApi.create(api);

  const mockedPreloadedState = mergeDeepRight(
    Store.initialState,
    store,
  ) as Store.State;

  const mockedStore = Store.create({ api: mockedApi }, mockedPreloadedState);

  return (
    <ThemeProvider>
      <Api.Provider api={mockedApi}>
        <Store.Provider store={mockedStore}>{children}</Store.Provider>
      </Api.Provider>
    </ThemeProvider>
  );
}

export type Props = Omit<Parameters<typeof TestBed>[0], "children">;
