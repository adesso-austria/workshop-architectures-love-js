import * as Demoize from "demoize";
import React from "react";
import * as TestBed from "./testbed";

export const demoize = (
  path: string,
  component: () => React.ReactElement,
  {
    wrapper: Wrapper = React.Fragment,
    api = {},
    store = {},
  }: {
    wrapper?: (props: React.PropsWithChildren) => React.ReactElement | null;
  } & Partial<TestBed.Props> = {},
) => {
  return Demoize.demoize(path, component, ({ children }) => (
    <TestBed.TestBed api={api} store={store}>
      <div style={{ padding: "2rem" }}>
        <Wrapper>{children}</Wrapper>
      </div>
    </TestBed.TestBed>
  ));
};
