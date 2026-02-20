/**
 * Holds current A/B test identifiers.
 */
export const enum AbTest {}

let _abTest: AbTest | null = null

export const getAbTest = (): AbTest | null => {
  return _abTest
}
