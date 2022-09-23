import * as Contracts from "contracts";
import { option } from "fp-ts";
import * as Domain from "../domain";

export const toDomain = (
  contract: Contracts.components["schemas"]["Todo"],
): Domain.Todo.Todo => ({
  id: option.some(contract.id),
  title: contract.title,
  content: option.none,
});
