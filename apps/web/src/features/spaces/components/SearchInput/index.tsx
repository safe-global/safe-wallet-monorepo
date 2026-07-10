import { useCallback } from 'react'
import { debounce } from 'lodash'
import { SearchInput as SearchInputPrimitive } from '@/components/ui/search-input'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

interface SearchInputProps {
  placeholder?: string
  onSearch: (value: string) => void
  debounceTime?: number
}

const SearchInput = ({ placeholder = 'Search', onSearch, debounceTime = 300 }: SearchInputProps) => {
  const isDarkMode = useDarkMode()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(onSearch, debounceTime), [onSearch, debounceTime])

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <SearchInputPrimitive
        className="w-full transition-[width] duration-150 ease-in-out focus-within:sm:w-[470px] sm:w-[250px]"
        iconClassName="text-[var(--color-border-main)]"
        aria-label="Search"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value)
        }}
      />
    </div>
  )
}

export default SearchInput
