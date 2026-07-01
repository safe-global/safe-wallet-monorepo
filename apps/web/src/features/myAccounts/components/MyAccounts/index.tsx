import AccountListFilters from '../AccountListFilters'
import AccountsHeader from '../AccountsHeader'
import AccountsList from '../AccountsList'
import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import madProps from '@/utils/mad-props'
import css from '../../styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { type AllSafeItemsGrouped, useAllSafesGrouped } from '@/hooks/safes'
import classNames from 'classnames'
import useTrackSafesCount from '../../hooks/useTrackedSafesCount'
import { DataWidget } from '../DataWidget'

type MyAccountsProps = {
  safes: AllSafeItemsGrouped
  isSidebar?: boolean
  onLinkClick?: () => void
}

const MyAccounts = ({ safes, onLinkClick, isSidebar = false }: MyAccountsProps) => {
  const wallet = useWallet()
  const isSignedIn = useIsSignedIn()
  const [searchQuery, setSearchQuery] = useState('')
  useTrackSafesCount(safes, wallet)

  return (
    <div data-testid="sidebar-safe-container" className={css.container}>
      <div
        className={classNames(css.myAccounts, {
          [css.sidebarAccounts]: isSidebar,
          [css.headerSpacer]: !isSignedIn,
        })}
      >
        <AccountsHeader isSidebar={isSidebar} onLinkClick={onLinkClick} />

        <div className="bg-background rounded-lg">
          <AccountListFilters setSearchQuery={setSearchQuery} />

          {isSidebar && <Separator />}

          <div className={classNames('bg-background', css.safeList)}>
            <AccountsList searchQuery={searchQuery} safes={safes} isSidebar={isSidebar} onLinkClick={onLinkClick} />
          </div>
        </div>

        {isSidebar && <Separator />}
        <DataWidget />
      </div>
    </div>
  )
}

export default madProps(MyAccounts, {
  safes: useAllSafesGrouped,
})
