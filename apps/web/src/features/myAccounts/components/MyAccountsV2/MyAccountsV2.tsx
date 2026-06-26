import { useState } from 'react'
import AccountsHeader from '../AccountsHeader'
import AccountsList from './components/AccountsList'
import AccountsSearch from './components/AccountsSearch'
import madProps from '@/utils/mad-props'
import css from '../../styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { type AllSafeItemsGrouped, useAllSafesGrouped } from '@/hooks/safes'
import classNames from 'classnames'
import useTrackSafesCount from '../../hooks/useTrackedSafesCount'
import { Separator } from '@/components/ui/separator'
import { DataWidget } from '../DataWidget'

type MyAccountsProps = {
  safes: AllSafeItemsGrouped
  isSidebar?: boolean
  onLinkClick?: () => void
}

const MyAccountsV2 = ({ safes, onLinkClick, isSidebar = false }: MyAccountsProps) => {
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

        <div className="bg-background/50 text-card-foreground overflow-hidden rounded-xl">
          <AccountsSearch setSearchQuery={setSearchQuery} />

          {isSidebar && <Separator />}

          <div className={classNames(css.safeList)}>
            <AccountsList searchQuery={searchQuery} safes={safes} isSidebar={isSidebar} onLinkClick={onLinkClick} />
          </div>
        </div>

        <DataWidget />
      </div>
    </div>
  )
}

export default madProps(MyAccountsV2, {
  safes: useAllSafesGrouped,
})
