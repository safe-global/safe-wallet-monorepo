import { useState } from 'react'
import AccountsNavigation from '../AccountsNavigation'
import AccountsList from './components/AccountsList'
import AccountsSearch from './components/AccountsSearch'
import GetStartedCard from './components/GetStartedCard'
import TrustedAccountsActions from './components/TrustedAccountsActions'
import madProps from '@/utils/mad-props'
import css from '../../styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItemsGrouped, useAllSafesGrouped } from '@/hooks/safes'
import useTrackSafesCount from '../../hooks/useTrackedSafesCount'
import useMigrationPrompt from '../../hooks/useMigrationPrompt'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import { Separator } from '@/components/ui/separator'
import { DataWidget } from '../DataWidget'

type MyAccountsProps = {
  safes: AllSafeItemsGrouped
  onLinkClick?: () => void
}

const MyAccountsV2 = ({ safes, onLinkClick }: MyAccountsProps) => {
  const wallet = useWallet()
  const [searchQuery, setSearchQuery] = useState('')
  const modal = useTrustedSafesModal()
  const migration = useMigrationPrompt()
  useTrackSafesCount(safes, wallet)

  const showGetStarted = !wallet && !migration.hasPinnedSafes

  return (
    <div data-testid="sidebar-safe-container" className={css.container}>
      <div className={css.myAccounts}>
        <div className="flex justify-center py-6">
          <AccountsNavigation />
        </div>

        {showGetStarted ? (
          <GetStartedCard />
        ) : (
          <div className="bg-card text-card-foreground overflow-hidden rounded-3xl">
            <TrustedAccountsActions onManage={modal.open} onLinkClick={onLinkClick} />

            <AccountsSearch setSearchQuery={setSearchQuery} />

            <Separator />

            <div className={css.safeList}>
              <AccountsList
                searchQuery={searchQuery}
                safes={safes}
                modal={modal}
                migration={migration}
                onLinkClick={onLinkClick}
              />
            </div>
          </div>
        )}

        <TrustedSafesModal modal={modal} />

        <DataWidget />
      </div>
    </div>
  )
}

export default madProps(MyAccountsV2, {
  safes: useAllSafesGrouped,
})
