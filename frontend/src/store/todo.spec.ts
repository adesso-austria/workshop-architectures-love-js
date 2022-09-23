import { waitFor } from "@testing-library/react";
import { taskEither } from "fp-ts";
import { DeepPartial } from "utils";
import { mergeDeepRight } from "ramda";
import { pipe } from "fp-ts/lib/function";
import * as Test from "../test";
import * as Store from "./store";
import { initialState, slice, State } from "./todo";
import * as Async from "./async";

describe("reducer", () => {
  const createState = (overrides: DeepPartial<State>): State =>
    mergeDeepRight(initialState, overrides);

  describe("addTodo", () => {
    it("should not change the state if todos are being added already", () => {
      const initial = createState({
        todos: pipe(Async.of({}), Async.setPending("adding todo")),
      });
      const next = slice.reducer(
        initial,
        slice.actions.addTodo({ content: "foo", title: "bar" }),
      );

      expect(next).toEqual(initial);
    });
  });
});

describe("epic", () => {
  it("should add a todo if addTodo is dispatched", async () => {
    const addTodo = jest.fn(() => taskEither.right(Test.Data.Todo.buyIcecream));

    const store = Store.create({ api: Test.Api.create({ addTodo }) });

    store.dispatch(slice.actions.addTodo({ title: "foo", content: "bar" }));

    expect(addTodo).toHaveBeenCalled();
    await waitFor(() =>
      expect(Object.values(Async.value(store.getState().todo.todos))).toEqual([
        Async.of(Test.Data.Todo.buyIcecream),
      ]),
    );
  });

  it("should fetch todos if fetchTodos is dispatched", async () => {
    const fetchTodos = jest.fn();

    const store = Store.create({ api: Test.Api.create({ fetchTodos }) });

    store.dispatch(slice.actions.fetchTodos());

    expect(fetchTodos).toHaveBeenCalled();
  });
});
