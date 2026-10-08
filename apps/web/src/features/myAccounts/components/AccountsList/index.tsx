import FilteredSafes from '../FilteredSafes'
import PinnedSafes from '../PinnedSafes'
import CurrentSafe from '../CurrentSafe'
import ConnectWalletPrompt from '../ConnectWalletPrompt'
import { type AllSafeItems, type AllSafeItemsGrouped, getComparator } from '@/hooks/safes'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import useMigrationPrompt from '../../hooks/useMigrationPrompt'
import useWallet from '@/hooks/wallets/useWallet'
import { useMemo, useCallback } from 'react'
import { AccountsListView } from '@views/features/myAccounts/components/AccountsList/AccountsListView'

const AccountsList = ({
  searchQuery,
  safes,
  onLinkClick,
}: {
  searchQuery: string
  safes: AllSafeItemsGrouped
  onLinkClick?: () => void
  isSidebar?: boolean
}) => {
  const wallet = useWallet()
  const isConnected = Boolean(wallet)

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  // Safe selection modal hook
  const modal = useTrustedSafesModal()

  // Migration prompt hook
  const migration = useMigrationPrompt()

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  // Handle migration flow - opens modal (user must explicitly select safes)
  const handleMigrationProceed = useCallback(() => {
    modal.open()
  }, [modal])

  if (searchQuery) {
    return <FilteredSafes searchQuery={searchQuery} allSafes={allSafes} onLinkClick={onLinkClick} />
  }

  // Show connect wallet prompt only when not connected AND no pinned safes
  // If user has pinned safes in local storage, show them regardless of wallet connection
  if (!isConnected && !migration.hasPinnedSafes) {
    return <ConnectWalletPrompt />
  }

  return (
    <AccountsListView
      showMigrationPrompt={migration.shouldShowPrompt}
      onMigrationProceed={handleMigrationProceed}
      showEmptyState={!migration.hasPinnedSafes && !migration.shouldShowPrompt}
      currentSafe={<CurrentSafe allSafes={allSafes} onLinkClick={onLinkClick} />}
      pinnedSafes={<PinnedSafes allSafes={allSafes} onLinkClick={onLinkClick} onOpenSelectionModal={modal.open} />}
      trustedSafesModal={<TrustedSafesModal modal={modal} />}
    />
  )
}

export default AccountsList
