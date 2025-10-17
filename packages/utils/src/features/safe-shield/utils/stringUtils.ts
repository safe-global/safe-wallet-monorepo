/**
 * Capitalises the first letter of a string
 * @param str - The string to capitalise
 * @returns The string with the first letter capitalised
 * @example
 * capitalise('hello') // returns 'Hello'
 * capitalise('world') // returns 'World'
 */
export const capitalise = (str: string): string => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str)

/**
 * Pluralises a word based on the count
 * @param count - The count to format
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word (defaults to singular + 's')
 * @returns The singular or plural form of the word
 * @example
 * pluralise(1, 'recipient') // returns 'recipient'
 * pluralise(3, 'recipient') // returns 'recipients'
 */
export const pluralise = (count: number, singular: string, plural: string = `${singular}s`): string =>
  count === 1 ? singular : plural

/**
 * Formats a count with singular/plural forms and special handling for "all"
 * @param count - The count to format
 * @param singular - The singular form of the word
 * @param totalNumber - The total count (if number equals this, returns "all") (defaults to undefined)
 * @param plural - The plural form of the word (defaults to singular + 's')
 * @returns A formatted string with the count and appropriate word form
 * @example
 * formatCount(1, 5, 'recipient') // returns '1 recipient'
 * formatCount(3, 5, 'recipient') // returns '3 recipients'
 * formatCount(5, 5, 'recipient') // returns 'all recipients'
 */
export const formatCount = (
  count: number,
  singular: string,
  totalNumber: number | undefined = undefined,
  plural: string = `${singular}s`,
): string => {
  const countPrefix = count === totalNumber ? 'all' : count
  return `${countPrefix} ${pluralise(count, singular, plural)}`
}
