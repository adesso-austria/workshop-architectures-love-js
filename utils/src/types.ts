export type DeepPartial<T extends Record<string | number | symbol, unknown>> = {
  [k in keyof T]?: T[k] extends Record<string | number | symbol, unknown>
    ? DeepPartial<T[k]>
    : T[k];
};
