import SearchIcon from '@/public/images/common/search.svg'
import { useCallback } from 'react'
import { debounce } from 'lodash'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

interface SearchInputProps {
  placeholder?: string
  onSearch: (value: string) => void
  debounceTime?: number
}

const SearchInput = ({ onSearch, debounceTime = 300 }: SearchInputProps) => {
  const isDarkMode = useDarkMode()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(onSearch, debounceTime), [onSearch, debounceTime])

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <InputGroup className="w-full transition-[width] duration-150 ease-in-out focus-within:sm:w-[470px] sm:w-[250px]">
        <InputGroupAddon>
          <SearchIcon className="size-4 text-[var(--color-border-main)]" data-testid="search-icon" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search"
          placeholder="Search"
          onChange={(e) => {
            handleSearch(e.target.value)
          }}
        />
      </InputGroup>
    </div>
  )
}

export default SearchInput
