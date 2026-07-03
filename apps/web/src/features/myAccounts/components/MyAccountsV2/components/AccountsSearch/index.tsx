import { type Dispatch, type SetStateAction, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

type AccountsSearchProps = {
  setSearchQuery: Dispatch<SetStateAction<string>>
}

const AccountsSearch = ({ setSearchQuery }: AccountsSearchProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  return (
    <div className="w-full px-4 py-3">
      <InputGroup className="bg-card px-3 rounded-lg">
        <InputGroupAddon align="inline-start">
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          id="search-by-name"
          placeholder="Search for Safe accounts"
          aria-label="Search Safe list by name"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </InputGroup>
    </div>
  )
}

export default AccountsSearch
