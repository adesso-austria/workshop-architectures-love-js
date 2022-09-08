import { taskEither } from "fp-ts";
import * as Domain from "../domain";
import * as Db from "./db";

export type Repository = {
  getUnknownEvents: () => taskEither.TaskEither<
    string,
    Domain.DomainEvent.DomainEvent[]
  >;
};

export const create = (db: Db.Db): Repository => ({
  getUnknownEvents: () => taskEither.left("not implemented"),
});
