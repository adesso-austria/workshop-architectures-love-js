import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { array, either, task, taskEither } from "fp-ts";
import * as Rx from "rxjs";
import { flow, pipe } from "fp-ts/lib/function";
import { combineEpics } from "redux-observable";
import * as React from "react";
import { match, P } from "ts-pattern";
import { ignore } from "utils";
import * as Domain from "../domain";
import { useDispatch, useSelector } from "./provider";
import * as Store from "./store";

export type State = {
  todos: Domain.Async.Async<Array<Domain.Todo.Todo>>;
  newTodo: Domain.AddTodo.AddTodo;
};
export const initialState: State = {
  todos: Domain.Async.pending(),
  newTodo: {
    title: "",
    content: "",
  },
};

const emptyTodos = () => [] as Domain.Todo.Todo[];

export const slice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    addTodo: (state, _action: PayloadAction<Domain.AddTodo.AddTodo>) => {
      if (!Domain.Async.isSettled(state.todos)) {
        // ignore request to add todo while list is pending
        return;
      }
      state.todos = Domain.Async.pending(state.todos);
    },
    addTodoSuccess: (state, action: PayloadAction<Domain.Todo.Todo>) => {
      state.todos = pipe(
        state.todos,
        Domain.Async.getOrElse(emptyTodos),
        array.append(action.payload),
        Domain.Async.of,
      );
      state.newTodo = { title: "", content: "" };
    },
    addTodoFailure: (state, _action: PayloadAction<string>) => {
      state.todos = pipe(
        state.todos,
        Domain.Async.getOrElse(emptyTodos),
        Domain.Async.of,
      );
    },
    fetchTodos: (state) => {
      state.todos = Domain.Async.pending(state.todos);
    },
    fetchTodosResponse: (
      state,
      action: PayloadAction<either.Either<string, Domain.Todo.Todo[]>>,
    ) => {
      match(action.payload)
        .with(either.left(P._), ignore)
        .with(either.right(P.select()), (todos) => {
          state.todos = Domain.Async.of(todos);
        })
        .exhaustive();
    },
    setNewTodo: (state, action: PayloadAction<Domain.AddTodo.AddTodo>) => {
      state.newTodo = action.payload;
    },
  },
});

const fetchTodosEpic: Store.Epic = (action$, _state$, { api }) =>
  action$.pipe(
    Rx.filter(slice.actions.fetchTodos.match),
    Rx.switchMap(() => {
      const getAction = pipe(
        api.fetchTodos(),
        task.map(slice.actions.fetchTodosResponse),
      );

      return getAction();
    }),
  );

const addTodoEpic: Store.Epic = (action$, _state, { api }) =>
  action$.pipe(
    Rx.filter(slice.actions.addTodo.match),
    Rx.switchMap(({ payload: addTodo }) => {
      const addAction = pipe(
        api.addTodo(addTodo),
        taskEither.matchW(
          slice.actions.addTodoFailure,
          slice.actions.addTodoSuccess,
        ),
      );

      return addAction();
    }),
  );

export const epic = combineEpics(fetchTodosEpic, addTodoEpic);

namespace Selectors {
  const selecState = (state: Store.State) => state.todo;

  export const selectTodos = flow(selecState, ({ todos }) => todos);

  export const selectNewTodo = flow(selecState, ({ newTodo }) => newTodo);
}

export const useTodos = () => {
  const dispatch = useDispatch();

  const refresh = () => dispatch(slice.actions.fetchTodos());

  React.useEffect(() => {
    refresh();
  }, []);

  const todosState = useSelector(Selectors.selectTodos);

  return {
    todos: pipe(todosState, Domain.Async.getOrElse(emptyTodos)),
    pending: Domain.Async.isPending(todosState),
    refresh,
  };
};

export const useNewTodo = (): [
  Domain.AddTodo.AddTodo,
  (
    updateFn: (current: Domain.AddTodo.AddTodo) => Domain.AddTodo.AddTodo,
  ) => void,
] => {
  const dispatch = useDispatch();
  const current = useSelector(Selectors.selectNewTodo);
  return [
    current,
    (updateFn) => dispatch(slice.actions.setNewTodo(updateFn(current))),
  ];
};

export const useAddTodo = () => {
  const dispatch = useDispatch();
  const isPending = useSelector((state) =>
    Domain.Async.isPending(state.todo.todos),
  );

  return isPending
    ? ignore
    : (todo: Domain.AddTodo.AddTodo) => dispatch(slice.actions.addTodo(todo));
};
