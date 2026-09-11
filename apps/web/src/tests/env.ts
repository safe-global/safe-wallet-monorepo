/**
 * Sets `NEXT_PUBLIC_IS_PRODUCTION`, deleting the key when passed `undefined`.
 *
 * Assigning `undefined` to a `process.env` entry stores the *string* `"undefined"`, so restoring a
 * previously unset variable that way leaves it truthy. Use this for both the set and the restore.
 */
export const setIsProduction = (value: string | undefined): void => {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_IS_PRODUCTION
  } else {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = value
  }
}
