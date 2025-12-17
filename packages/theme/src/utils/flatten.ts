/**
 * Utility to flatten nested palette objects.
 * Used primarily for Tamagui which needs flat color tokens.
 *
 * Example:
 *   Input: { text: { primary: '#000' } }
 *   Output with suffix 'Light': { textPrimaryLight: '#000' }
 */

type NestedColorObject = {
  [key: string]: string | NestedColorObject
}

/**
 * Flatten a nested object into a flat object with concatenated keys.
 * Supports optional suffix for theme differentiation (e.g., 'Light', 'Dark').
 */
export function flattenPalette<Suffix extends string = ''>(
  palette: object,
  options?: { suffix?: Suffix },
): Record<string, string> {
  const result: Record<string, string> = {}
  const suffix = options?.suffix ?? ''

  function flatten(current: NestedColorObject, parentKey = ''): void {
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const value = current[key]
        const newKey = parentKey ? parentKey + key.charAt(0).toUpperCase() + key.slice(1) : key

        if (typeof value === 'object' && value !== null) {
          flatten(value, newKey)
        } else {
          result[newKey + suffix] = value
        }
      }
    }
  }

  flatten(palette as NestedColorObject)
  return result
}
