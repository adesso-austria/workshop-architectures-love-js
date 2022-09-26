import { option, record } from "fp-ts";

type TaskState =
  | { state: "resolved" }
  | { state: "rejected"; error: string }
  | { state: "pending" };

type Tasks<Tasknames extends string> = {
  [t in Tasknames]?: TaskState;
};

/**
 * represents a value associated with different
 * tasks that could change that value
 */
export type Async<T, Tasknames extends string> = {
  current: T;
  tasks: Tasks<Tasknames>;
};

type TaskNames<A extends Async<unknown, string>> = A extends Async<
  unknown,
  infer TaskNames
>
  ? TaskNames
  : string;

type AsyncType<A extends Async<unknown, string>> = A extends Async<
  infer Type,
  string
>
  ? Type
  : unknown;

export const of = <T, Task extends string>(
  value: T,
  tasks: Tasks<Task> = {},
): Async<T, Task> => ({
  current: value,
  tasks,
});

export const map =
  <T, U, Task extends string>(fn: (current: T) => U) =>
  (async: Async<T, Task>): Async<U, Task> => ({
    current: fn(async.current),
    tasks: async.tasks,
  });

export const chain =
  <T, U, Task extends string>(fn: (current: T) => Async<U, Task>) =>
  (async: Async<T, Task>): Async<U, Task> =>
    fn(async.current);

export const setResolved =
  <A extends Async<unknown, string>>(task: TaskNames<A>) =>
  (on: A) =>
    ({
      ...on,
      tasks: {
        ...on.tasks,
        [task]: { state: "resolved" },
      },
    } as A);

export const setPending =
  <A extends Async<unknown, string>>(task: TaskNames<A>) =>
  (on: A) =>
    ({
      current: on.current,
      tasks: {
        ...on.tasks,
        [task]: { state: "pending" },
      },
    } as A);

export const setError =
  <A extends Async<unknown, string>>(task: TaskNames<A>, error: string) =>
  (async: A) =>
    ({
      ...async,
      tasks: {
        ...async.tasks,
        [task]: { state: "rejected", error },
      },
    } as A);

export const isPending =
  <A extends Async<unknown, string>>(task: TaskNames<A>) =>
  (async: A): boolean =>
    async.tasks[task]?.state === "pending";

export const isAnyPending = <T, Task extends string>(async: Async<T, Task>) =>
  record
    .keys(async.tasks as Record<Task, TaskState>)
    .some((task) => isPending(task)(async));

export const isSettled =
  <A extends Async<unknown, string>>(task: TaskNames<A>) =>
  (async: A) =>
    !isPending(task)(async);

export const areAllSettled = <T, Task extends string>(async: Async<T, Task>) =>
  !isAnyPending(async);

export const value = <T>(async: Async<T, string>) => async.current;

export const getError =
  <A extends Async<unknown, string>>(task: TaskNames<A>) =>
  (async: A): option.Option<string> => {
    const t = async.tasks[task];
    return t?.state === "rejected" ? option.some(t.error) : option.none;
  };
