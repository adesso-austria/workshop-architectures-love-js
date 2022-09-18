import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { either, task } from "fp-ts";
import * as Rx from "rxjs";
import { flow, pipe } from "fp-ts/lib/function";
import { combineEpics } from "redux-observable";
import * as React from "react";
import * as Domain from "../domain";
import { useDispatch, useSelector } from "./store";
import { Epic } from "./provider";

export type State = {
  todos: Domain.Lazy.Lazy<Domain.Todo.Todo[]>;
};
export const initialState: State = {
  todos: Domain.Lazy.of(either.right([])),
};

export const slice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    fetchTodos: (state) => {
      state.todos.type = "pending";
    },
    fetchTodosResponse: (
      state,
      action: PayloadAction<Domain.Lazy.Result<Domain.Todo.Todo[]>>,
    ) => {
      state.todos = Domain.Lazy.of(action.payload);
    },
  },
});

const fetchTodosEpic: Epic = (action$, _state$, { api }) =>
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

export const epic = combineEpics(fetchTodosEpic);

export const useTodos = () => {
  const dispatch = useDispatch();

  const refresh = () => dispatch(slice.actions.fetchTodos());

  React.useEffect(() => {
    refresh();
  }, []);

  return {
    todos: useSelector(
      flow(
        (state) => state.todo.todos,
        Domain.Lazy.match(
          () => [],
          () => [],
          (todos) => todos,
        ),
      ),
    ),
    refresh,
  };
};
