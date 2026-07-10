import { type Dispatch, type SetStateAction, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { SearchInput } from '@/components/ui/search-input'

type AccountsSearchProps = {
  setSearchQuery: Dispatch<SetStateAction<string>>
}

const AccountsSearch = ({ setSearchQuery }: AccountsSearchProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  return (
    <div className="w-full px-4 py-3">
      <SearchInput
        id="search-by-name"
        placeholder="Search for safes"
        aria-label="Search Safe list by name"
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  )
}

export default AccountsSearch
