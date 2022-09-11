import { describe, expect, it } from "@jest/globals";
import { option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { throwException } from "utils";
import * as TestData from "../test-data";

describe("todo", () => {
  describe("getTodo", () => {
    it.todo("should return right none if the todo could not be found");

    it.todo("should return some todo that has been added before");

    it.todo("should sync the state before returning the todo");
  });

  describe("applyEvent", () => {
    it.todo("should add a todo for a createEvent");
  });
});
