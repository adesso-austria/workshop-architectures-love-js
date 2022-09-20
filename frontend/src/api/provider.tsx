import React from "react";
import * as Api from "./api";
import * as Fetcher from "./fetcher";

const context = React.createContext(undefined as undefined | Api.Api);

export const Provider = function ApiProvider({
  children,
  api = Api.create(Fetcher.create()),
}: React.PropsWithChildren<{ api?: Api.Api | undefined }>) {
  return <context.Provider value={api}>{children}</context.Provider>;
};

export const useApi = () => {
  const api = React.useContext(context);
  if (api == null) {
    throw new Error(
      "api not instantiated, did you forget to wrap your app in <Api.Provider>?",
    );
  }
  return api;
};
