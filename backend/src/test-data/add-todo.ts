import { option } from "fp-ts";
import * as Domain from "../domain";

export const buyIcecream: Domain.AddTodo.AddTodo = {
  title: "Buy Ice-Cream",
  content: option.some("buy some ice cream"),
};

export const buyMild: Domain.AddTodo.AddTodo = {
  title: "Buy Milk",
  content: option.some("buy some milk"),
};

export const all = [buyIcecream];
