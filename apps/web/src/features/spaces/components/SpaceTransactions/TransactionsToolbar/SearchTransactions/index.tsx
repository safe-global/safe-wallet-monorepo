import { useEffect, useRef, useState, type ReactElement } from 'react'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { SearchInput } from '@safe-global/views/components/ui/search-input'

const SEARCH_DEBOUNCE_MS = 300
const MAX_SEARCH_LENGTH = 100 // the gateway rejects longer searches

type SearchTransactionsProps = {
  /** Called with the trimmed text once typing pauses, and at once when cleared */
  onSearch: (query: string) => void
}

// Holds the typed text itself so a keystroke re-renders the input, not the queue below it
const SearchTransactions = ({ onSearch }: SearchTransactionsProps): ReactElement => {
  const [value, setValue] = useState('')
  const debouncedQuery = useDebounce(value.trim(), SEARCH_DEBOUNCE_MS)
  const lastQuery = useRef('')

  useEffect(() => {
    if (debouncedQuery === lastQuery.current) return
    lastQuery.current = debouncedQuery
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  const handleClear = () => {
    setValue('')
    lastQuery.current = ''
    onSearch('')
  }

  return (
    <SearchInput
      aria-label="Search transactions"
      placeholder="Safes, networks, urgency, pending signers…"
      value={value}
      maxLength={MAX_SEARCH_LENGTH}
      onChange={(event) => setValue(event.target.value)}
      onClear={handleClear}
      className="min-w-0 flex-1"
    />
  )
}

export default SearchTransactions
