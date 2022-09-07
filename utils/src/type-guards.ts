export const isArray = (x: unknown): x is unknown[] => Array.isArray(x);

export const isRecord = (
  x: unknown
): x is Record<string | number | symbol, unknown> =>
  typeof x === "object" && x != null && !isArray(x);

export const hasKeys =
  <K extends string>(keys: K[]) =>
  (x: unknown): x is Record<K, unknown> =>
    isRecord(x) && keys.every((key) => key in x);
