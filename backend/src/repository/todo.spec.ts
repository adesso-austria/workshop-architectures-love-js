import { either, option, taskEither } from "fp-ts";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import type * as Mongo from "../adapters/mongo";
import * as Test from "../test";
import * as Todo from "./todo";

const create = (overrides: DeepPartial<Todo.CreateOpts>): Todo.Repository =>
  Todo.create(
    mergeDeepRight(
      {
        redis: Test.Adapters.Redis.create({}),
        mongo: Test.Adapters.Mongo.create({}),
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
            option.some(Test.Data.Todo.buyIcecream),
          )) as Mongo.Adapter["findOne"],
      },
    });

    const task = repo.getTodo("foo");
    expect(await task()).toEqual(
      either.right(option.some(Test.Data.Todo.buyIcecream)),
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

    const task = repo.addTodo(Test.Data.Todo.buyIcecream);
    await task();

    expect(addOne).toHaveBeenCalledWith(
      Todo.collectionKey,
      Test.Data.Todo.buyIcecream,
    );
  });
});

describe("getTodos", () => {
  it("should simply return all from adapter", async () => {
    const repo = create({
      mongo: {
        findAll: (() =>
          taskEither.right([
            Test.Data.Todo.buyMilk,
          ])) as Mongo.Adapter["findAll"],
      },
    });

    const task = repo.getTodos();
    const result = await task();

    expect(result).toEqual(either.right([Test.Data.Todo.buyMilk]));
  });
});

describe("deleteTodo", () => {
  it("should delete the todo via mongo", async () => {
    const deleteOne = jest.fn(() => taskEither.right(undefined));
    const repo = create({ mongo: { deleteOne } });

    const deleteTodo = repo.deleteTodo("foo");
    await deleteTodo();

    expect(deleteOne).toHaveBeenCalledWith(Todo.collectionKey, { id: "foo" });
  });
});

describe("updateTodo", () => {
  it("should update the todo by id via mongo", async () => {
    const updateOne = jest.fn(() => taskEither.right(undefined));
    const repo = create({ mongo: { updateOne } });

    const updateTodo = repo.updateTodo(Test.Data.Todo.buyIcecream);
    await updateTodo();

    expect(updateOne).toHaveBeenCalledWith(
      Todo.collectionKey,
      { id: Test.Data.Todo.buyIcecream.id },
      Test.Data.Todo.buyIcecream,
    );
  });
});
