import * as Identifier from "./identifier";
import * as Lazy from "./lazy";

export type Hateoas<T> = [Identifier.Identifier, Lazy.Lazy<T>];

export const pending = <T>(identifier: Identifier.Identifier): Hateoas<T> => [
  identifier,
  Lazy.pending(),
];
