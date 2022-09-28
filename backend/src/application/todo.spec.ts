import { either, option, taskEither } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { DeepPartial, ignore, throwException } from "utils";
import { Repository } from "../repository";
import * as Test from "../test";
import * as Todo from "./todo";

const create = (repository: DeepPartial<Repository>): Todo.Application =>
  Todo.create(Test.Repository.create(repository));

describe("getTodo", () => {
  it(
    "should return left if the repository throws an error",
    pipe(
      create({
        todo: {
          getTodo: () => taskEither.left("something's up"),
        },
      }),
      (app) => app.getTodo("foo"),
      taskEither.match(ignore, () => throwException("expected a left")),
    ),
  );

  it(
    "should return left if the repository can't find the todo",
    pipe(
      create({
        todo: {
          getTodo: () => taskEither.right(option.none),
        },
      }),
      (app) => app.getTodo("foo"),
      taskEither.match(ignore, () => throwException("expected a left")),
    ),
  );

  it(
    "should return a right if the repository can find the todo",
    pipe(
      create({
        todo: {
          getTodo: () =>
            taskEither.right(option.some(Test.Data.Todo.buyIcecream)),
        },
      }),
      (app) => app.getTodo("foo"),
      taskEither.match(() => throwException("expected a right"), ignore),
    ),
  );
});

describe("getTodos", () => {
  it("should get the todos via repo", async () => {
    const getTodos = jest.fn(() => taskEither.right([]));
    const app = create({
      todo: {
        getTodos,
      },
    });

    const task = app.getTodos();
    await task();

    expect(getTodos).toHaveBeenCalled();
  });

  it("should map repo rejection to 'db error'", async () => {
    const app = create({
      todo: {
        getTodos: () => taskEither.left("some error"),
      },
    });

    const task = app.getTodos();

    expect(await task()).toEqual(either.left("db error"));
  });
});

describe("addTodo", () => {
  it("should add the todo via repository", async () => {
    const addTodo = jest.fn(() => taskEither.right(undefined));
    const app = create({
      todo: {
        addTodo,
      },
    });

    const task = app.addTodo(Test.Data.AddTodo.buyIcecream);
    await task();

    expect(addTodo).toHaveBeenCalledWith(
      expect.objectContaining(Test.Data.AddTodo.buyIcecream),
    );
  });
});

describe("deleteTodo", () => {
  it("should delete the todo via repository", async () => {
    const deleteTodo = jest.fn(() => taskEither.right(undefined));
    const app = create({
      todo: {
        deleteTodo,
      },
    });

    const task = app.deleteTodo("foo");
    await task();

    expect(deleteTodo).toHaveBeenCalledWith("foo");
  });
});

describe("updateTodo", () => {
  it("should update the todo via repository", async () => {
    const updateTodo = jest.fn(() => taskEither.right(undefined));
    const app = create({
      todo: {
        updateTodo,
      },
    });

    const task = app.updateTodo(Test.Data.Todo.buyIcecream);
    await task();

    expect(updateTodo).toHaveBeenCalledWith(Test.Data.Todo.buyIcecream);
  });
});
