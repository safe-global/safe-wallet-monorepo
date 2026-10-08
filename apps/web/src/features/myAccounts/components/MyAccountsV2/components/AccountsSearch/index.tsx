import { type Dispatch, type SetStateAction, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { AccountsSearchView } from '@views/features/myAccounts/components/MyAccountsV2/components/AccountsSearch/AccountsSearchView'

type AccountsSearchProps = {
  setSearchQuery: Dispatch<SetStateAction<string>>
}

const AccountsSearch = ({ setSearchQuery }: AccountsSearchProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  return <AccountsSearchView onSearch={handleSearch} />
}

export default AccountsSearch
