/**
 * Utility to flatten nested palette objects.
 * Used primarily for Tamagui which needs flat color tokens.
 *
 * Example:
 *   Input: { text: { primary: '#000' } }
 *   Output with suffix 'Light': { textPrimaryLight: '#000' }
 */

type Prev = [never, 0, 1, 2, 3, 4, 5]

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never

/**
 * Recursively computes the flattened key-value type of a nested palette object.
 * Preserves exact key names so that downstream consumers (e.g. Tamagui createTokens)
 * know which color tokens exist at the type level.
 */
type Flatten<T, Prefix extends string = '', Suffix extends string = '', Depth extends number = 5> = [Depth] extends [
  never,
]
  ? object
  : T extends object
    ? {
        [K in keyof T as T[K] extends object
          ? never
          : Prefix extends ''
            ? `${K & string}${Suffix}`
            : `${Prefix}${Capitalize<K & string>}${Suffix}`]: T[K]
      } & UnionToIntersection<
        {
          [K in keyof T]: T[K] extends object
            ? Flatten<T[K], Prefix extends '' ? K & string : `${Prefix}${Capitalize<K & string>}`, Suffix, Prev[Depth]>
            : object
        }[keyof T]
      >
    : object

/**
 * Flatten a nested object into a flat object with concatenated keys.
 * Supports optional suffix for theme differentiation (e.g., 'Light', 'Dark').
 *
 * The return type preserves exact key names so Tamagui can infer
 * which color tokens exist, enabling strongly-typed useTheme().
 */
export function flattenPalette<T extends object, Suffix extends string = ''>(
  palette: T,
  options?: { suffix?: Suffix },
): Flatten<T, '', Suffix> {
  const result: Record<string, string> = {}
  const suffix = (options?.suffix ?? '') as Suffix

  function flatten(current: Record<string, unknown>, parentKey = ''): void {
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const value = current[key]
        const newKey = parentKey ? parentKey + key.charAt(0).toUpperCase() + key.slice(1) : key

        if (typeof value === 'object' && value !== null) {
          flatten(value as Record<string, unknown>, newKey)
        } else {
          result[newKey + suffix] = value as string
        }
      }
    }
  }

  flatten(palette as Record<string, unknown>)
  return result as Flatten<T, '', Suffix>
}
