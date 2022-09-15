import { describe, expect, it, jest } from "@jest/globals";
import { either, option, taskEither } from "fp-ts";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import { Mongo } from "../adapters";
import * as TestData from "../test-data";
import * as Todo from "./todo";

const create = (overrides: DeepPartial<Todo.CreateOpts>): Todo.Repository =>
  Todo.create(
    mergeDeepRight(
      {
        redis: TestData.Adapters.Redis.create({}),
        mongo: TestData.Adapters.Mongo.create({}),
      },
      overrides,
    ),
  );

describe("getTodo", () => {
  it("should return right none if the todo could not be found", async () => {
    const repo = create({
      mongo: {
        findOne: () => taskEither.right(option.none),
      },
    });

    const task = repo.getTodo("foo");
    expect(await task()).toEqual(either.right(option.none));
  });

  it("should return some todo that has been added before", async () => {
    const repo = create({
      mongo: {
        findOne: (() =>
          taskEither.right(
            option.some(TestData.Todo.buyIcecream),
          )) as Mongo.Adapter["findOne"],
      },
    });

    const task = repo.getTodo("foo");
    expect(await task()).toEqual(
      either.right(option.some(TestData.Todo.buyIcecream)),
    );
  });
});

describe("addTodo", () => {
  it("should return simply add it to the repo", async () => {
    const addOne = jest.fn(() => taskEither.right(undefined));
    const repo = create({
      mongo: {
        addOne,
      },
    });

    const task = repo.addTodo(TestData.Todo.buyIcecream);
    await task();

    expect(addOne).toHaveBeenCalledWith(
      Todo.collectionKey,
      TestData.Todo.buyIcecream,
    );
  });
});

describe("getTodos", () => {
  it("should simply return all from adapter", async () => {
    const repo = create({
      mongo: {
        findAll: (() =>
          taskEither.right([
            TestData.Todo.buyMilk,
          ])) as Mongo.Adapter["findAll"],
      },
    });

    const task = repo.getTodos();
    const result = await task();

    expect(result).toEqual(either.right([TestData.Todo.buyMilk]));
  });
});
