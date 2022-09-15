import { throwIfCalled } from "utils";
import { Mongo } from "../../adapters";

const mocked = throwIfCalled("not sensible to call on mock");

export const adapter: Mongo.Adapter = {
  addOne: mocked,
  findOne: mocked,
  updateOne: mocked,
  deleteOne: mocked,
  close: mocked,
};
