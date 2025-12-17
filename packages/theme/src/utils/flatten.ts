/**
 * Utility to flatten nested palette objects.
 * Used primarily for Tamagui which needs flat color tokens.
 *
 * Example:
 *   Input: { text: { primary: '#000' } }
 *   Output with suffix 'Light': { textPrimaryLight: '#000' }
 */

interface Palette {
  [key: string]: string | Palette
}

type Flatten<
  T extends Palette,
  Prefix extends string = '',
  Suffix extends string = '',
  Depth extends number = 5,
> = [Depth] extends [never]
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

type Prev = [never, 0, 1, 2, 3, 4, 5]

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export function flattenPalette<T extends Palette, Suffix extends string = ''>(
  palette: T,
  options?: { suffix?: Suffix },
): Flatten<T, '', Suffix> {
  const result = {} as Flatten<T, '', Suffix>
  const suffix = (options?.suffix ?? '') as Suffix

  function flatten(current: Palette, parentKey = ''): void {
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const value = current[key]

        const newKey = parentKey ? parentKey + key.charAt(0).toUpperCase() + key.slice(1) : key

        if (typeof value === 'object' && value !== null) {
          flatten(value as Palette, newKey)
        } else {
          ;(result as Flatten<T, '', Suffix>)[(newKey + suffix) as keyof Flatten<T, '', Suffix>] = value as Flatten<
            T,
            '',
            Suffix
          >[keyof Flatten<T, '', Suffix>]
        }
      }
    }
  }

  flatten(palette)
  return result
}
