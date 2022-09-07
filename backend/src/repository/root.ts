import { option, taskEither } from "fp-ts";
import * as Mongo from "mongodb";
import * as Redis from "redis";
import * as Domain from "../domain";
import * as Todo from "./todo";

export type Repository = {
  todo: Todo.Repository;
};

export const create = (): Repository => ({
  todo: Todo.create(),
});
