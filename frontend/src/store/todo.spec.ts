import { waitFor } from "@testing-library/react";
import { taskEither } from "fp-ts";
import * as Domain from "../domain";
import * as Test from "../test";
import * as Store from "./store";
import { slice } from "./todo";

describe("epic", () => {
  it("should add a todo if addTodo is dispatched", async () => {
    const addTodo = jest.fn(() => taskEither.right(Test.Data.Todo.buyIcecream));

    const store = Store.create({ api: Test.Api.create({ addTodo }) });

    store.dispatch(slice.actions.addTodo({ title: "foo", content: "bar" }));

    expect(addTodo).toHaveBeenCalled();
    await waitFor(() =>
      expect(store.getState().todo.todos).toEqual(
        Domain.Async.of([Test.Data.Todo.buyIcecream]),
      ),
    );
  });

  it("should fetch todos if fetchTodos is dispatched", async () => {
    const fetchTodos = jest.fn();

    const store = Store.create({ api: Test.Api.create({ fetchTodos }) });

    store.dispatch(slice.actions.fetchTodos());

    expect(fetchTodos).toHaveBeenCalled();
  });
});
