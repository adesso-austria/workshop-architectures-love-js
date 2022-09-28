import { waitFor } from "@testing-library/react";
import * as Rx from "rxjs";
import { option, record, taskEither } from "fp-ts";
import { DeepPartial, ignore } from "utils";
import { mergeDeepRight } from "ramda";
import { flow, pipe } from "fp-ts/lib/function";
import { StateObservable } from "redux-observable";
import * as Test from "../test";
import { Api } from "../api";
import * as Async from "../store/async";
import * as Store from "./store";
import { epic, initialState, slice, State } from "./todo";

const createState = (overrides: DeepPartial<State>): State =>
  mergeDeepRight(initialState, overrides);

describe("reducer", () => {
  it.each<
    [
      string,
      DeepPartial<State>,
      Store.Action,
      (state: State, initialState: State) => void,
    ]
  >([
    [
      "addTodo should not change state if todos are being added already",
      { todos: pipe(Async.of({}), Async.setPending("adding todo")) },
      slice.actions.addTodo({ title: "bar" }),
      (state, initial) => expect(state).toEqual(initial),
    ],
    [
      "deleteTodo should set the respective task to pending",
      { todos: pipe(Async.of({ foo: Async.of(Test.Data.Todo.buyIcecream) })) },
      slice.actions.deleteTodo("foo"),
      (state) =>
        expect(
          pipe(
            Async.value(state.todos),
            record.lookup("foo"),
            option.map(Async.isPending("deleting")),
          ),
        ).toEqual(option.some(true)),
    ],
    [
      "deleteTodoSuccess should remove the respective todo from state",
      { todos: Async.of({ foo: Async.of(Test.Data.Todo.buyIcecream) }) },
      slice.actions.deleteTodoSuccess("foo"),
      (state) => expect(Async.value(state.todos)).toEqual({}),
    ],
    [
      "deleteTodoFailure should set the respective task to an error state",
      { todos: Async.of({ foo: Async.of(Test.Data.Todo.buyIcecream) }) },
      slice.actions.deleteTodoFailure({ id: "foo", error: "some error" }),
      (state) =>
        expect(
          pipe(
            Async.value(state.todos),
            record.lookup("foo"),
            option.chain(Async.getError("deleting")),
          ),
        ).toEqual(option.some("some error")),
    ],
    [
      "updateTodo should set the respective task to pending",
      {
        todos: Async.of({
          [Test.Data.Todo.buyIcecream.id]: Async.of(Test.Data.Todo.buyIcecream),
        }),
      },
      slice.actions.updateTodo(Test.Data.Todo.buyIcecream),
      (state) =>
        expect(
          pipe(
            Async.value(state.todos),
            record.lookup(Test.Data.Todo.buyIcecream.id),
            option.map(Async.isPending("updating")),
          ),
        ).toEqual(option.some(true)),
    ],
    [
      "updateTodoSuccess should resolve the respective task and replace the todo",
      {
        todos: Async.of({
          [Test.Data.Todo.buyIcecream.id]: Async.of(Test.Data.Todo.buyIcecream),
        }),
      },
      slice.actions.updateTodoSuccess({
        ...Test.Data.Todo.buyIcecream,
        content: option.some("something updated"),
      }),
      (state) => {
        const todo = pipe(
          Async.value(state.todos),
          record.lookup(Test.Data.Todo.buyIcecream.id),
        );
        expect(pipe(todo, option.map(Async.isSettled("updating")))).toEqual(
          option.some(true),
        );

        expect(
          pipe(todo, option.chain(flow(Async.value, (todo) => todo.content))),
        ).toEqual(option.some("something updated"));
      },
    ],
    [
      "updateTodoFailure should set an error on the respective task",
      {
        todos: Async.of({
          [Test.Data.Todo.buyIcecream.id]: Async.of(Test.Data.Todo.buyIcecream),
        }),
      },
      slice.actions.updateTodoFailure({
        id: Test.Data.Todo.buyIcecream.id,
        error: "some error",
      }),
      (state) => {
        expect(
          pipe(
            Async.value(state.todos),
            record.lookup(Test.Data.Todo.buyIcecream.id),
            option.chain(Async.getError("updating")),
          ),
        ).toEqual(option.some("some error"));
      },
    ],
  ])("%s", (_, givenState, whenAction, assert) => {
    const initial = createState(givenState);

    const next = slice.reducer(initial, whenAction);

    assert(next, initial);
  });

  describe("fetchContent", () => {
    it("should set the respective todos task to pending", () => {
      const initial = createState({
        todos: Async.of({ foo: Async.of(Test.Data.Todo.buyIcecream) }),
      });

      const next = slice.reducer(initial, slice.actions.fetchContent("foo"));

      expect(
        pipe(
          Async.value(next.todos),
          record.lookup("foo"),
          option.map(Async.isPending("fetching content")),
        ),
      ).toEqual(option.some(true));
    });
  });

  describe("fetchContentSuccess", () => {
    it("should resolve the respective todos task and set its content", () => {
      const initial = createState({
        todos: Async.of({ foo: Async.of(Test.Data.Todo.buyIcecream) }),
      });

      const next = slice.reducer(
        initial,
        slice.actions.fetchContentSuccess({ id: "foo", content: "bar" }),
      );

      expect(
        pipe(
          Async.value(next.todos),
          record.lookup("foo"),
          option.chain(flow(Async.value, (todo) => todo.content)),
        ),
      ).toEqual(option.some("bar"));
    });
  });

  describe("fetchContentFailure", () => {
    it("should set an error on the respective todos task", () => {
      const initial = createState({
        todos: Async.of({ foo: Async.of(Test.Data.Todo.buyIcecream) }),
      });

      const next = slice.reducer(
        initial,
        slice.actions.fetchContentFailure({ id: "foo", error: "bar" }),
      );

      expect(
        pipe(
          Async.value(next.todos),
          record.lookup("foo"),
          option.chain(Async.getError("fetching content")),
        ),
      ).toEqual(option.some("bar"));
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

    store.dispatch(slice.actions.addTodo({ title: "foo" }));

    expect(addTodo).toHaveBeenCalled();
    await waitFor(() =>
      expect(Object.values(Async.value(store.getState().todo.todos))).toEqual([
        Async.of(Test.Data.Todo.buyIcecream),
      ]),
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
          todos: Async.of({
            foo: Async.of(Test.Data.Todo.buyIcecream),
          }),
        },
        { deleteTodo },
      );
      action$.subscribe(ignore);

      expect(deleteTodo).toHaveBeenCalled();
    });

    it("should dispatch failure if api fails", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.deleteTodo("foo")),
        {
          todos: Async.of({
            foo: Async.of(Test.Data.Todo.buyIcecream),
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
          todos: Async.of({
            foo: Async.of(Test.Data.Todo.buyIcecream),
          }),
        },
        { deleteTodo: () => taskEither.right(undefined) },
      );

      expect(await Rx.firstValueFrom(action$)).toEqual(
        slice.actions.deleteTodoSuccess("foo"),
      );
    });
  });

  describe("fetching content", () => {
    it("should dispatch success on api success", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.fetchContent("foo")),
        {},
        { fetchContent: () => taskEither.right("bar") },
      );

      expect(await Rx.firstValueFrom(action$)).toEqual(
        slice.actions.fetchContentSuccess({ id: "foo", content: "bar" }),
      );
    });

    it("should dispatch failuer on api failure", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.fetchContent("foo")),
        {},
        { fetchContent: () => taskEither.left("bar") },
      );

      expect(await Rx.firstValueFrom(action$)).toEqual(
        slice.actions.fetchContentFailure({ id: "foo", error: "bar" }),
      );
    });
  });

  describe("updating todos", () => {
    it("should call api updateTodo", async () => {
      const updateTodo = jest.fn(() => taskEither.right(undefined));
      const action$ = createAction$(
        Rx.of(slice.actions.updateTodo(Test.Data.Todo.buyIcecream)),
        {
          todos: Async.of({
            [Test.Data.Todo.buyIcecream.id]: Async.of(
              Test.Data.Todo.buyIcecream,
            ),
          }),
        },
        { updateTodo },
      );

      await Rx.firstValueFrom(action$);

      expect(updateTodo).toHaveBeenCalled();
    });

    it("should dispatch success if api succeeds", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.updateTodo(Test.Data.Todo.buyIcecream)),
        {
          todos: Async.of({
            [Test.Data.Todo.buyIcecream.id]: Async.of(
              Test.Data.Todo.buyIcecream,
            ),
          }),
        },
        { updateTodo: () => taskEither.right(undefined) },
      );

      const action = await Rx.firstValueFrom(action$);

      expect(action).toEqual(
        slice.actions.updateTodoSuccess(Test.Data.Todo.buyIcecream),
      );
    });

    it("should dispatch failure if api fails", async () => {
      const action$ = createAction$(
        Rx.of(slice.actions.updateTodo(Test.Data.Todo.buyIcecream)),
        {
          todos: Async.of({
            [Test.Data.Todo.buyIcecream.id]: Async.of(
              Test.Data.Todo.buyIcecream,
            ),
          }),
        },
        { updateTodo: () => taskEither.left("some error") },
      );

      const action = await Rx.firstValueFrom(action$);

      expect(action).toEqual(
        slice.actions.updateTodoFailure({
          id: Test.Data.Todo.buyIcecream.id,
          error: "some error",
        }),
      );
    });
  });
});
