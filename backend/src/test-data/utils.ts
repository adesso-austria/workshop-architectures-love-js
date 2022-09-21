import { throwIfCalled } from "utils";

export const mocked = throwIfCalled("not sensible to call on mock");
