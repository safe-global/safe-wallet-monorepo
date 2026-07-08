import { useState } from 'react'
import AccountsNavigation from '../AccountsNavigation'
import AccountsList from './components/AccountsList'
import AccountsSearch from './components/AccountsSearch'
import GetStartedCard from './components/GetStartedCard'
import TrustedAccountsActions from './components/TrustedAccountsActions'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import AddTrustedSafesCard from '@/components/common/AddTrustedSafesCard'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { useDarkMode } from '@/hooks/useDarkMode'
import madProps from '@/utils/mad-props'
import css from '../../styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItemsGrouped, useAllSafesGrouped } from '@/hooks/safes'
import useTrackSafesCount from '../../hooks/useTrackedSafesCount'
import useMigrationPrompt from '../../hooks/useMigrationPrompt'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import { DataWidget } from '../DataWidget'

type MyAccountsProps = {
  safes: AllSafeItemsGrouped
  onLinkClick?: () => void
}

const MyAccountsV2 = ({ safes, onLinkClick }: MyAccountsProps) => {
  const wallet = useWallet()
  const isDarkMode = useDarkMode()
  const [searchQuery, setSearchQuery] = useState('')
  const modal = useTrustedSafesModal()
  const migration = useMigrationPrompt()
  useTrackSafesCount(safes, wallet)

  const showGetStarted = !wallet && !migration.hasPinnedSafes
  const showEmptyState = !showGetStarted && !migration.isLoading && !migration.hasPinnedSafes
  const showList = !showGetStarted && !showEmptyState

  return (
    <div data-testid="sidebar-safe-container" className={css.container}>
      <div className={css.myAccounts}>
        <div className="flex justify-center py-6">
          <AccountsNavigation />
        </div>

        {showGetStarted && <GetStartedCard />}

        {showEmptyState && <AddTrustedSafesCard onAdd={modal.open} />}

        {showList && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1">
                <AccountsSearch setSearchQuery={setSearchQuery} />
              </div>
              <ShadcnProvider dark={isDarkMode} className="flex items-center">
                <SafeListSortToggle className="border-border shadow-xs" />
              </ShadcnProvider>
              <TrustedAccountsActions onManage={modal.open} onLinkClick={onLinkClick} />
            </div>

            <AccountsList searchQuery={searchQuery} safes={safes} onLinkClick={onLinkClick} />
          </div>
        )}

        <TrustedSafesModal modal={modal} />

        {!showEmptyState && <DataWidget />}
      </div>
    </div>
  )
}

export default madProps(MyAccountsV2, {
  safes: useAllSafesGrouped,
})
