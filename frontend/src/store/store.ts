// have to use the lib somewhere...
// eslint-disable-next-line no-restricted-imports
import * as ReactRedux from "react-redux";
import * as ReduxObservable from "redux-observable";
import type { Action, Dispatch, State } from "./provider";

export const useDispatch: () => Dispatch = ReactRedux.useDispatch;
export const useSelector: ReactRedux.TypedUseSelectorHook<State> =
  ReactRedux.useSelector;
