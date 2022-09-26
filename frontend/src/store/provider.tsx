import React from "react";
// have to use library somewhere...
// eslint-disable-next-line no-restricted-imports
import * as ReactRedux from "react-redux";
import * as Api from "../api";
import * as Store from "./store";

export const Provider = function StoreProvider({
  children,
  store,
}: React.PropsWithChildren<{ store?: Store.Store | undefined }>) {
  const api = Api.useApi();

  const store_ = store ?? Store.create({ api });

  return <ReactRedux.Provider store={store_}>{children}</ReactRedux.Provider>;
};

export const useDispatch: () => Store.Dispatch = ReactRedux.useDispatch;
export const useSelector: ReactRedux.TypedUseSelectorHook<Store.State> =
  ReactRedux.useSelector;
export const useStore: () => Store.Store = ReactRedux.useStore;
