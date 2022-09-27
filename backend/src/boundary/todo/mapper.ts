import * as Contracts from "contracts";
import * as Domain from "../../domain";

export const fromDomain = (
  todo: Domain.Todo.Todo,
): Contracts.components["schemas"]["Todo"] => ({
  id: todo.id,
  title: todo.title,
  isDone: todo.isDone,
});
