import { isDomainEvent } from "./domain-event";

describe("isDomainEvent", () => {
  it("should report false for events that have an unknown key", () => {
    expect(isDomainEvent({ type: "foo", payload: 0 })).toEqual(false);
  });
});
