import React from "react";
// have to use library somewhere...
// eslint-disable-next-line no-restricted-imports
import * as ReactRedux from "react-redux";
import * as RTK from "@reduxjs/toolkit";
import * as ReduxObservable from "redux-observable";
import * as Api from "../api";
import * as Todo from "./todo";

export type State = {
  todo: Todo.State;
};
type SliceActions<Actions> = Actions extends {
  [k: string]: infer ActionCreator;
}
  ? // this is one of those cases where unknown or never narrow the types
    // too much so that nothing would match the extends clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ActionCreator extends RTK.ActionCreatorWithPayload<any, any>
    ? ReturnType<ActionCreator>
    : unknown
  : unknown;

export type Action = SliceActions<typeof Todo["slice"]["actions"]>;

export type Dispatch = RTK.Dispatch<Action>;
export type Dependencies = { api: Api.Api };
export type Epic = ReduxObservable.Epic<Action, Action, State, Dependencies>;

export const Provider = function StoreProvider({
  children,
  preloadedState,
}: React.PropsWithChildren<{ preloadedState?: State | undefined }>) {
  const epicMiddleware = ReduxObservable.createEpicMiddleware<
    Action,
    Action,
    State,
    Dependencies
  >({});

  const store = RTK.configureStore<State, Action>({
    reducer: {
      todo: Todo.slice.reducer,
    },
    middleware: [epicMiddleware],
    ...(preloadedState == null ? {} : { preloadedState }),
  });

  return <ReactRedux.Provider store={store}>{children}</ReactRedux.Provider>;
};
