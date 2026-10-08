import AccountListFilters from '../AccountListFilters'
import AccountsHeader from '../AccountsHeader'
import AccountsList from '../AccountsList'
import { useState } from 'react'
import madProps from '@/utils/mad-props'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItemsGrouped, useAllSafesGrouped } from '@/hooks/safes'
import useTrackSafesCount from '../../hooks/useTrackedSafesCount'
import { DataWidget } from '../DataWidget'
import { MyAccountsView } from '@views/features/myAccounts/components/MyAccounts/MyAccountsView'

type MyAccountsProps = {
  safes: AllSafeItemsGrouped
  isSidebar?: boolean
  onLinkClick?: () => void
}

const MyAccounts = ({ safes, onLinkClick, isSidebar = false }: MyAccountsProps) => {
  const wallet = useWallet()
  const [searchQuery, setSearchQuery] = useState('')
  useTrackSafesCount(safes, wallet)

  return (
    <MyAccountsView
      isSidebar={isSidebar}
      header={<AccountsHeader isSidebar={isSidebar} onLinkClick={onLinkClick} />}
      filters={<AccountListFilters setSearchQuery={setSearchQuery} />}
      accountsList={
        <AccountsList searchQuery={searchQuery} safes={safes} isSidebar={isSidebar} onLinkClick={onLinkClick} />
      }
      dataWidget={<DataWidget />}
    />
  )
}

export default madProps(MyAccounts, {
  safes: useAllSafesGrouped,
})
