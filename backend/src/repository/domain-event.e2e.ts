import { describe, it, expect } from "@jest/globals";
import { taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as Domain from "../domain";

describe("domain-event", () => {
  it(
    "should create state from events",
    pipe(
      taskEither.of([
        {
          type: "create todo",
          payload: {
            title: "test",
            content: "test content",
          },
        },
      ] as Domain.DomainEvent.DomainEvent[])
      // taskEither.chain(applyEvents),
      // taskEither.chain(() => Mongo.create())
    )
  );

  it.todo("should re-create the latest state from the missing events");
});
