import React from "react";
import * as RTK from "@reduxjs/toolkit";
import * as ReactRedux from "react-redux";

const store = RTK.configureStore({
  reducer: {},
});

export const Provider = function StoreProvider({
  children,
}: React.PropsWithChildren) {
  return <ReactRedux.Provider store={store}>{children}</ReactRedux.Provider>;
};
