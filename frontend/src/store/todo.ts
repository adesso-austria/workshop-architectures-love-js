import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { option, record, taskEither } from "fp-ts";
import * as Rx from "rxjs";
import { flow, pipe } from "fp-ts/lib/function";
import { combineEpics } from "redux-observable";
import * as React from "react";
import { ignore } from "utils";
import * as Domain from "../domain";
import { useDispatch, useSelector } from "./provider";
import * as Store from "./store";
import * as Async from "./async";

type Todo = Async.Async<Domain.Todo.Todo, "deleting" | "updating">;
type Todos = Async.Async<Record<string, Todo>, "fetching" | "adding todo">;

export type State = {
  todos: Todos;
  newTodo: Domain.AddTodo.AddTodo;
};
export const initialState: State = {
  todos: Async.of({}),
  newTodo: {
    title: "",
    content: "",
  },
};

namespace Selectors {
  export const fromStore = (state: Store.State) => state.todo;

  export const selectTodos = ({ todos }: State) => todos;

  export const selectNewTodo = ({ newTodo }: State) => newTodo;

  export const selectById = (id: string) =>
    flow(selectTodos, Async.value, (todos) => todos[id]);
}

export const slice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    addTodo: (state, _action: PayloadAction<Domain.AddTodo.AddTodo>) => {
      if (pipe(state.todos, Async.isPending("adding todo"))) {
        // ignore request to add todo while list is pending
        return;
      }
      state.todos = pipe(state.todos, Async.setPending("adding todo"));
    },
    addTodoSuccess: (state, action: PayloadAction<Domain.Todo.Todo>) => {
      pipe(
        action.payload.id,
        option.match(
          // refusing to add a todo without id
          ignore,
          (id) => {
            state.todos = pipe(
              state.todos,
              Async.setResolved("adding todo"),
              Async.map(record.upsertAt(id, Async.of(action.payload))),
            );
            state.newTodo = { title: "", content: "" };
          },
        ),
      );
    },
    addTodoFailure: (state, action: PayloadAction<string>) => {
      state.todos = pipe(
        state.todos,
        Async.setError("adding todo", action.payload),
      );
    },
    deleteTodo: (state, action: PayloadAction<string>) => {
      state.todos = pipe(
        state.todos,
        Async.map((todos) =>
          pipe(
            todos,
            record.modifyAt(action.payload, Async.setPending("deleting")),
            option.getOrElse(() => todos),
          ),
        ),
      );
    },
    deleteTodoSuccess: (state, action: PayloadAction<string>) => {
      state.todos = pipe(
        state.todos,
        Async.map(record.deleteAt(action.payload)),
      );
    },
    deleteTodoFailure: (
      state,
      action: PayloadAction<{ id: string; error: string }>,
    ) => {
      state.todos = pipe(
        state.todos,
        Async.map((todos) =>
          pipe(
            todos,
            record.modifyAt(
              action.payload.id,
              Async.setError("deleting", action.payload.error),
            ),
            option.getOrElse(() => todos),
          ),
        ),
      );
    },
    fetchTodos: (state) => {
      state.todos = pipe(state.todos, Async.setPending("fetching"));
    },
    fetchTodosSuccess: (state, action: PayloadAction<Domain.Todo.Todo[]>) => {
      state.todos = Async.of(
        action.payload.reduce(
          (dict, todo) =>
            pipe(
              todo.id,
              option.match(
                // ignore todos without ids; should be none but theoretically possible
                () => dict,
                (id) => {
                  dict[id] = Async.of(todo);
                  return dict;
                },
              ),
            ),
          {} as Record<string, Todo>,
        ),
      );
    },
    fetchTodosFailure: (state, action: PayloadAction<string>) => {
      state.todos = pipe(
        state.todos,
        Async.setError("fetching", action.payload),
      );
    },
    setNewTodo: (state, action: PayloadAction<Domain.AddTodo.AddTodo>) => {
      state.newTodo = action.payload;
    },
  },
});

namespace Epics {
  const fetchTodosEpic: Store.Epic = (action$, _state$, { api }) =>
    action$.pipe(
      Rx.filter(slice.actions.fetchTodos.match),
      Rx.switchMap(() => {
        const getAction = pipe(
          api.fetchTodos(),
          taskEither.matchW(
            slice.actions.fetchTodosFailure,
            slice.actions.fetchTodosSuccess,
          ),
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

  const deleteTodoEpic: Store.Epic = (action$, state$, { api }) =>
    action$.pipe(
      Rx.filter(slice.actions.deleteTodo.match),
      Rx.withLatestFrom(state$),
      Rx.filter(
        ([action, state]) =>
          Selectors.selectById(action.payload)(state.todo) != null,
      ),
      Rx.switchMap(([{ payload: id }]) => {
        const deleteAction = pipe(
          api.deleteTodo(id),
          taskEither.matchW(
            (error) => slice.actions.deleteTodoFailure({ id, error }),
            () => slice.actions.deleteTodoSuccess(id),
          ),
        );

        return deleteAction();
      }),
    );

  export const epic = combineEpics(fetchTodosEpic, addTodoEpic, deleteTodoEpic);
}
export const epic = Epics.epic;

export const useTodos = () => {
  const dispatch = useDispatch();

  const refresh = () => dispatch(slice.actions.fetchTodos());

  React.useEffect(() => {
    refresh();
  }, []);

  const todosState = useSelector(
    flow(Selectors.fromStore, Selectors.selectTodos),
  );

  return {
    todos: Object.values(Async.value(todosState)).map(Async.value),
    pending: Async.isAnyPending(todosState),
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
  const current = useSelector(
    flow(Selectors.fromStore, Selectors.selectNewTodo),
  );
  return [
    current,
    (updateFn) => dispatch(slice.actions.setNewTodo(updateFn(current))),
  ];
};

export const useAddTodo = () => {
  const dispatch = useDispatch();

  const isPending = useSelector(
    flow(
      Selectors.fromStore,
      Selectors.selectTodos,
      Async.isPending("adding todo"),
    ),
  );

  return isPending
    ? ignore
    : (todo: Domain.AddTodo.AddTodo) => dispatch(slice.actions.addTodo(todo));
};

export const useDeleteTodo = (todo: Pick<Domain.Todo.Todo, "id">) => {
  const dispatch = useDispatch();

  const deleteTodo = pipe(
    todo.id,
    option.match(
      // no id, can't delete => ignore request to delete
      () => ignore,
      (id) => () => dispatch(slice.actions.deleteTodo(id)),
    ),
  );

  const isPending = useSelector(
    pipe(
      todo.id,
      option.match(
        // no id, no information about pending state => assume not pending
        () => () => false,
        (id) =>
          flow(
            Selectors.fromStore,
            Selectors.selectById(id),
            option.fromNullable,
            option.map(Async.isPending("deleting")),
            option.getOrElse(() => false),
          ),
      ),
    ),
  );

  return { deleteTodo, isPending };
};
