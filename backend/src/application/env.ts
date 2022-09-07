import { Repository } from "../repository";

export type Env = {
  repository: Repository;
};

export const create = (repository: Repository): Env => ({ repository });
