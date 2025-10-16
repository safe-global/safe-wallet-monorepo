/**
 * Capitalises the first letter of a string
 * @param str - The string to capitalise
 * @returns The string with the first letter capitalised
 * @example
 * capitalise('hello') // returns 'Hello'
 * capitalise('world') // returns 'World'
 */
export const capitalise = (str: string): string => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Formats a count with singular/plural forms and special handling for "all"
 * @param number - The count to format
 * @param totalNumber - The total count (if number equals this, returns "all")
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word (defaults to singular + 's')
 * @returns A formatted string with the count and appropriate word form
 * @example
 * formatCount(1, 5, 'recipient') // returns '1 recipient'
 * formatCount(3, 5, 'recipient') // returns '3 recipients'
 * formatCount(5, 5, 'recipient') // returns 'all recipients'
 */
export const formatCount = (
  number: number,
  totalNumber: number | undefined,
  singular: string,
  plural: string = `${singular}s`,
): string => {
  if (number === 1) return `1 ${singular}`
  if (number === totalNumber) return `all ${plural}`
  return `${number} ${plural}`
}
