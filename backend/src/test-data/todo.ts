import * as Crypto from "crypto";
import * as Domain from "../domain";

export const buyIcecream: Domain.Todo.Todo = {
  id: Crypto.randomUUID(),
  title: "Buy Ice-Cream",
  content: "buy some ice cream",
};

export const all = [buyIcecream];
