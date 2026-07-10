import { useAppDispatch, useAppSelector } from '@/store'
import { type OrderByOption, selectOrderByPreference, setOrderByPreference } from '@/store/orderByPreferenceSlice'
import debounce from 'lodash/debounce'
import { type Dispatch, type SetStateAction, useCallback } from 'react'
import OrderByButton from '../OrderByButton'
import { SearchInput } from '@/components/ui/search-input'

const AccountListFilters = ({ setSearchQuery }: { setSearchQuery: Dispatch<SetStateAction<string>> }) => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  const handleOrderByChange = (orderBy: OrderByOption) => {
    dispatch(setOrderByPreference({ orderBy }))
  }

  return (
    <div className="px-4 py-2">
      <div className="flex w-full justify-between gap-2">
        <SearchInput
          className="w-full"
          id="search-by-name"
          placeholder="Search by name, ENS, address, or chain"
          aria-label="Search Safe list by name"
          onChange={(e) => {
            handleSearch(e.target.value)
          }}
        />
        <OrderByButton orderBy={orderBy} onOrderByChange={handleOrderByChange} />
      </div>
    </div>
  )
}

export default AccountListFilters
