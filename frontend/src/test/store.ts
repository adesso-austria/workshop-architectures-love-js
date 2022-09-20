import * as Store from "../store";

export const waitFor = (
  store: Store.Store,
  predicate: (state: Store.State) => boolean,
) =>
  new Promise<Store.State>((resolve) => {
    const checkPredicate = () => {
      const state = store.getState();
      if (predicate(state)) {
        resolve(state);
        unsub();
      }
    };

    const unsub = store.subscribe(() => {
      checkPredicate();
    });

    checkPredicate();
  });
