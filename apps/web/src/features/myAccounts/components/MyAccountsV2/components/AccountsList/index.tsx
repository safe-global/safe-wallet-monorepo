import { useCallback, useEffect, useMemo } from 'react'
import { type AllSafeItems, type AllSafeItemsGrouped, getComparator, useSafesSearch } from '@/hooks/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { Typography } from '@/components/ui/typography'

import MigrationPrompt from '../../../MigrationPrompt'
import AddTrustedSafesCard from '@/components/common/AddTrustedSafesCard'
import type { UseTrustedSafesModalReturn } from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import type { UseMigrationPromptReturn } from '../../../../hooks/useMigrationPrompt'
import SafeAccountsTable from '../../../SafeAccountsTable'

type AccountsListProps = {
  searchQuery: string
  safes: AllSafeItemsGrouped
  modal: UseTrustedSafesModalReturn
  migration: UseMigrationPromptReturn
  onLinkClick?: () => void
}

const AccountsList = ({ searchQuery, safes, modal, migration, onLinkClick }: AccountsListProps) => {
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const { safe: currentSafe, safeAddress } = useSafeInfo()
  const addressBook = useAddressBook()

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  const filteredSafes = useSafesSearch(allSafes, searchQuery)

  const pinnedSafes = useMemo<AllSafeItems>(() => allSafes.filter((s) => s.isPinned), [allSafes])

  const currentSafeInList = useMemo(
    () => (safeAddress ? allSafes.find((s) => sameAddress(s.address, safeAddress)) : undefined),
    [allSafes, safeAddress],
  )

  const currentSafeItem = useMemo(
    () =>
      safeAddress
        ? {
            chainId: currentSafe.chainId,
            address: safeAddress,
            isReadOnly: !currentSafeInList,
            isPinned: false,
            lastVisited: -1,
            name: addressBook[safeAddress],
          }
        : undefined,
    [currentSafe.chainId, safeAddress, currentSafeInList, addressBook],
  )

  const handleMigrationProceed = useCallback(() => modal.open(), [modal])

  useEffect(() => {
    if (searchQuery) {
      trackEvent({ category: OVERVIEW_EVENTS.SEARCH.category, action: OVERVIEW_EVENTS.SEARCH.action })
    }
  }, [searchQuery])

  if (searchQuery) {
    return (
      <>
        <Typography variant="paragraph-small" color="muted" className="mb-2">
          Found {filteredSafes.length} result{maybePlural(filteredSafes)}
        </Typography>
        <SafeAccountsTable items={filteredSafes} onLinkClick={onLinkClick} />
      </>
    )
  }

  const showCurrentSafe = safeAddress && currentSafeItem && !currentSafeInList?.isPinned
  const showEmptyState = !migration.hasPinnedSafes && !migration.shouldShowPrompt

  return (
    <>
      {migration.shouldShowPrompt && <MigrationPrompt onProceed={handleMigrationProceed} />}

      {showCurrentSafe && (
        <section data-testid="current-safe-section" className="mb-6">
          <Typography variant="paragraph-small-bold" className="mb-2">
            Current Safe account
          </Typography>
          <SafeAccountsTable items={currentSafeItem ? [currentSafeItem] : []} onLinkClick={onLinkClick} />
        </section>
      )}

      {pinnedSafes.length > 0 && (
        <section data-testid="pinned-accounts" className="mb-4">
          <SafeAccountsTable items={pinnedSafes} onLinkClick={onLinkClick} />
        </section>
      )}

      {showEmptyState && <AddTrustedSafesCard onAdd={modal.open} />}
    </>
  )
}

export default AccountsList
