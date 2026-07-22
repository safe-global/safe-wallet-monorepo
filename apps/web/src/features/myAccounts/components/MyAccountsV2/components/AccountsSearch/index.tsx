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
    <div className="w-full">
      <SearchInput
        id="search-by-name"
        placeholder="by name, address or network"
        aria-label="Search Safe accounts by name, address or network"
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  )
}

export default AccountsSearch
