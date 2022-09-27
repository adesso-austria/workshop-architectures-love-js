import { option } from "fp-ts";
import { toDomain } from "./todo";

describe("toDomain", () => {
  it("should map a contract to a domain object", () => {
    expect(
      toDomain({
        id: "foo",
        title: "bar",
        isDone: false,
      }),
    ).toEqual({ id: "foo", title: "bar", content: option.none, isDone: false });
  });
});
