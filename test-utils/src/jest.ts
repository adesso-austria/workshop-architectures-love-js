import { describe, it } from "@jest/globals";

export type GivenWhenThen<Given, When, Then> = {
  description: string;
  details: undefined | { given: Given; when: When; then: Then };
};
export type GivenWhenThens<Given, When, Then> = Array<
  GivenWhenThen<Given, When, Then>
>;

export function givenWhenThen<Given, When, Then>(
  description: string,
): GivenWhenThen<Given, When, Then>;
export function givenWhenThen<Given, When, Then>(
  description: string,
  given: Given,
  when: When,
  then: Then,
): GivenWhenThen<Given, When, Then>;
export function givenWhenThen<Given, When, Then>(
  description: string,
  given?: Given,
  when?: When,
  then?: Then,
): GivenWhenThen<Given, When, Then> {
  const details =
    arguments.length === 1
      ? undefined
      : ({ given, when, then } as NonNullable<
          GivenWhenThen<Given, When, Then>["details"]
        >);
  return {
    description,
    details,
  };
}

export const testGivenWhenThen = <Given, When, Then>(
  description: string,
  test: (given: Given, when: When, then: Then) => Promise<void>,
  definitions: GivenWhenThens<Given, When, Then>,
) =>
  describe(description, () =>
    definitions.forEach(({ description, details }) =>
      details == null
        ? it.todo(description)
        : it(description, async () => {
            const { given, when, then } = details;
            await test(given, when, then);
          }),
    ),
  );

export function givenThen<Given, Then>(
  description: string,
): GivenWhenThen<Given, undefined, Then>;
export function givenThen<Given, Then>(
  description: string,
  given: Given,
  then: Then,
): GivenWhenThen<Given, undefined, Then>;
export function givenThen<Given, Then>(
  description: string,
  given?: Given,
  then?: Then,
): GivenWhenThen<Given, undefined, Then> {
  return arguments.length === 1
    ? givenWhenThen(description)
    : givenWhenThen(description, given as Given, undefined, then as Then);
}

export const testGivenThen = <Given, Then>(
  description: string,
  test: (given: Given, then: Then) => Promise<void>,
  definitions: GivenWhenThens<Given, undefined, Then>,
) =>
  testGivenWhenThen(
    description,
    (given, _, then) => test(given, then),
    definitions,
  );
