// yes, that's the point of a noop
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const ignore = () => {};

export const throwException = (data: unknown) => {
  throw data;
};
