import { useAppDispatch, useAppSelector } from '@/store'
import { type OrderByOption, selectOrderByPreference, setOrderByPreference } from '@/store/orderByPreferenceSlice'
import debounce from 'lodash/debounce'
import { type Dispatch, type SetStateAction, useCallback } from 'react'
import OrderByButton from '../OrderByButton'
import { AccountListFiltersView } from '@views/features/myAccounts/components/AccountListFilters/AccountListFiltersView'

const AccountListFilters = ({ setSearchQuery }: { setSearchQuery: Dispatch<SetStateAction<string>> }) => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  const handleOrderByChange = (orderBy: OrderByOption) => {
    dispatch(setOrderByPreference({ orderBy }))
  }

  return (
    <AccountListFiltersView
      onSearch={handleSearch}
      orderByButton={<OrderByButton orderBy={orderBy} onOrderByChange={handleOrderByChange} />}
    />
  )
}

export default AccountListFilters
