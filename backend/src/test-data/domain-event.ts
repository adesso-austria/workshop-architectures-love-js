import { DomainEvent } from "../domain";
import * as Todo from "./todo";

export const createBuyIcecream: DomainEvent.DomainEvent = {
  type: "create todo",
  payload: Todo.buyIcecream,
};
