import type { TokenOption } from './tokenOptions'

type Searchable = Pick<TokenOption, 'symbol' | 'name' | 'address'>

/** Case-insensitive substring match on symbol, name or address. Empty query matches everything. */
export const matchesTokenQuery = (option: Searchable, query: string): boolean => {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    option.symbol.toLowerCase().includes(needle) ||
    option.name.toLowerCase().includes(needle) ||
    option.address.toLowerCase().includes(needle)
  )
}

export const filterTokenOptions = <T extends Searchable>(options: readonly T[], query: string): T[] =>
  options.filter((option) => matchesTokenQuery(option, query))
