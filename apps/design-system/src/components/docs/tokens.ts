import type { TokenEntry } from '@/lib/types'

/** Resolves `var(--x)` references against the token values of one mode */
export const resolveValue = (value: string | undefined, values: Map<string, string>, depth = 0): string | undefined => {
  if (value === undefined || depth > 8) return value
  return value.replace(/var\((--[\w-]+)\)/g, (match, name: string) =>
    values.has(name) ? (resolveValue(values.get(name), values, depth + 1) ?? match) : match,
  )
}

export const modeValues = (tokens: TokenEntry[]) => {
  const light = new Map(tokens.filter((t) => t.light !== undefined).map((t) => [t.name, t.light!]))
  const dark = new Map(tokens.map((t) => [t.name, t.dark ?? t.light ?? '']))
  return { light, dark }
}
