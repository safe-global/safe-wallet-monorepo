import { useEffect, useRef, useState, type ReactElement } from 'react'
import { SearchInput } from '@safe-global/views/components/ui/search-input'

export const SEARCH_DEBOUNCE_MS = 300

type SearchTransactionsProps = {
  /** Called with the trimmed text once typing pauses, and at once when cleared */
  onSearch: (query: string) => void
}

// Holds the typed text itself so a keystroke re-renders the input, not the queue below it
const SearchTransactions = ({ onSearch }: SearchTransactionsProps): ReactElement => {
  const [value, setValue] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleChange = (next: string) => {
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearch(next.trim()), SEARCH_DEBOUNCE_MS)
  }

  const handleClear = () => {
    setValue('')
    clearTimeout(timer.current)
    onSearch('')
  }

  return (
    <SearchInput
      aria-label="Search transactions"
      placeholder="Search Safes, networks, status, and signers…"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      onClear={handleClear}
      className="min-w-0 flex-1"
    />
  )
}

export default SearchTransactions
