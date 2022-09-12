export type AnyRecord = Record<string | number | symbol, unknown>;

export type DeepPartial<T extends AnyRecord> = {
  [k in keyof T]?: T[k] extends AnyRecord ? DeepPartial<T[k]> : T[k];
};
