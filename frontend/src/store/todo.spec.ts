import { waitFor } from "@testing-library/react";
import * as Rx from "rxjs";
import { option, record, taskEither } from "fp-ts";
import { DeepPartial, ignore } from "utils";
import { mergeDeepRight } from "ramda";
import { pipe } from "fp-ts/lib/function";
import { StateObservable } from "redux-observable";
import * as Test from "../test";
import { Api } from "../api";
import * as Domain from "../domain";
import * as Store from "./store";
import { epic, initialState, slice, State } from "./todo";

const createState = (overrides: DeepPartial<State>): State =>
  mergeDeepRight(initialState, overrides);

describe("reducer", () => {
  describe("addTodo", () => {
    it("should not change the state if todos are being added already", () => {
      const initial = createState({
        todos: pipe(
          Domain.Async.of({}),
          Domain.Async.setPending("adding todo"),
        ),
      });
      const next = slice.reducer(
        initial,
        slice.actions.addTodo({ content: "foo", title: "bar" }),
      );

      expect(next).toEqual(initial);
    });
  });

  describe("deleteTodo", () => {
    it("should set the respective todo state to pending", () => {
      const initial = createState({
        todos: Domain.Async.of({
          foo: Domain.Async.of(Test.Data.Todo.buyIcecream),
        }),
      });

      const next = slice.reducer(initial, slice.actions.deleteTodo("foo"));

      expect(
        pipe(
          Domain.Async.value(next.todos),
          record.lookup("foo"),
          option.map(Domain.Async.isPending("deleting")),
        ),
      ).toEqual(option.some(true));
    });
  });

  describe("deleteTodoSuccess", () => {
    it("should remove the respective todo from state", () => {
      const initial = createState({
        todos: Domain.Async.of({
          foo: Domain.Async.of(Test.Data.Todo.buyIcecream),
        }),
      });

      const next = slice.reducer(
        initial,
        slice.actions.deleteTodoSuccess("foo"),
      );

      expect(Domain.Async.value(next.todos)).toEqual({});
    });
  });

  describe("deleteTodoFailure", () => {
    it("should set the respective todos task to an error state", () => {
      const initial = createState({
        todos: Domain.Async.of({
          foo: Domain.Async.of(Test.Data.Todo.buyIcecream),
        }),
      });

      const next = slice.reducer(
        initial,
        slice.actions.deleteTodoFailure({ id: "foo", error: "some error" }),
      );

      expect(
        pipe(
          Domain.Async.value(next.todos),
          record.lookup("foo"),
          option.chain(Domain.Async.getError("deleting")),
        ),
      ).toEqual(option.some("some error"));
    });
  });
});

describe("epic", () => {
  const createAction$ = (
    action$: Rx.Observable<Store.Action>,
    state: DeepPartial<State>,
    api: DeepPartial<Api>,
  ) =>
    epic(action$, new StateObservable(Rx.of(), { todo: createState(state) }), {
      api: Test.Api.create(api),
    });

  it("should add a todo if addTodo is dispatched", async () => {
    const addTodo = jest.fn(() => taskEither.right(Test.Data.Todo.buyIcecream));

    const store = Store.create({ api: Test.Api.create({ addTodo }) });

    store.dispatch(slice.actions.addTodo({ title: "foo", content: "bar" }));

    expect(addTodo).toHaveBeenCalled();
    await waitFor(() =>
      expect(
        Object.values(Domain.Async.value(store.getState().todo.todos)),
      ).toEqual([Domain.Async.of(Test.Data.Todo.buyIcecream)]),
    );
  });

  describe("fetching todos", () => {
    it("should fetch todos if fetchTodos is dispatched", async () => {
      const fetchTodos = jest.fn(() => taskEither.right([]));
      const action$ = createAction$(
        Rx.of(slice.actions.fetchTodos()),
        {},
        { fetchTodos },
      );

      await Rx.firstValueFrom(action$);
      expect(fetchTodos).toHaveBeenCalled();
    });

    it("should dispatch success on api success", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.fetchTodos()),
        {},
        { fetchTodos: () => taskEither.right([]) },
      );

      expect(await Rx.firstValueFrom(action$)).toEqual(
        slice.actions.fetchTodosSuccess([]),
      );
    });

    it("should dispatch failure on api failure", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.fetchTodos()),
        {},
        { fetchTodos: () => taskEither.left("nope") },
      );

      expect(await Rx.firstValueFrom(action$)).toEqual(
        slice.actions.fetchTodosFailure("nope"),
      );
    });
  });

  describe("deleting todos", () => {
    it("should call api deleteTodo", async () => {
      const deleteTodo = jest.fn();

      const action$ = createAction$(
        Rx.of(slice.actions.deleteTodo("foo")),
        {
          todos: Domain.Async.of({
            foo: Domain.Async.of(Test.Data.Todo.buyIcecream),
          }),
        },
        { deleteTodo },
      );
      action$.subscribe(ignore);

      expect(deleteTodo).toHaveBeenCalled();
    });

    it("should not call api if todo doesn't exist in state", async () => {
      const deleteTodo = jest.fn();
      const action$ = createAction$(
        Rx.of(slice.actions.deleteTodo("foo")),
        {},
        { deleteTodo },
      );
      action$.subscribe(ignore);

      expect(deleteTodo).not.toHaveBeenCalled();
    });

    it("should dispatch failure if api fails", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.deleteTodo("foo")),
        {
          todos: Domain.Async.of({
            foo: Domain.Async.of(Test.Data.Todo.buyIcecream),
          }),
        },
        { deleteTodo: () => taskEither.left("nope") },
      );

      expect(await Rx.firstValueFrom(action$)).toEqual(
        slice.actions.deleteTodoFailure({ id: "foo", error: "nope" }),
      );
    });

    it("should dispatch success if api succeeds", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.deleteTodo("foo")),
        {
          todos: Domain.Async.of({
            foo: Domain.Async.of(Test.Data.Todo.buyIcecream),
          }),
        },
        { deleteTodo: () => taskEither.right(undefined) },
      );

      expect(await Rx.firstValueFrom(action$)).toEqual(
        slice.actions.deleteTodoSuccess("foo"),
      );
    });
  });
});
