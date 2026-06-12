import { useCallback, useEffect, useMemo } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItems, type AllSafeItemsGrouped, getComparator, useSafesSearch } from '@/hooks/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'

import ConnectWalletPrompt from '../../../ConnectWalletPrompt'
import MigrationPrompt from '../../../MigrationPrompt'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import useMigrationPrompt from '../../../../hooks/useMigrationPrompt'
import AccountItem from '../AccountItem'

type AccountsListProps = {
  searchQuery: string
  safes: AllSafeItemsGrouped
  onLinkClick?: () => void
  isSidebar?: boolean
}

const AccountsList = ({ searchQuery, safes, onLinkClick }: AccountsListProps) => {
  const wallet = useWallet()
  const isConnected = Boolean(wallet)

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const modal = useTrustedSafesModal()
  const migration = useMigrationPrompt()

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
        <div className="flex flex-col gap-2">
          {filteredSafes.map((item) => (
            <AccountItem key={item.address} safe={item} onLinkClick={onLinkClick} />
          ))}
        </div>
      </>
    )
  }

  if (!isConnected && !migration.hasPinnedSafes) {
    return <ConnectWalletPrompt />
  }

  const showCurrentSafe = safeAddress && currentSafeItem && !currentSafeInList?.isPinned
  const showEmptyState = !migration.hasPinnedSafes && !migration.shouldShowPrompt

  return (
    <>
      {migration.shouldShowPrompt && <MigrationPrompt onProceed={handleMigrationProceed} />}

      {showCurrentSafe && (
        <section data-testid="current-safe-section" className="mb-6">
          <Typography variant="paragraph-small-bold" className="mb-2">
            Current Safe Account
          </Typography>
          <AccountItem safe={currentSafeItem} onLinkClick={onLinkClick} />
        </section>
      )}

      {pinnedSafes.length > 0 && (
        <div className="mb-4 flex items-center gap-1.5">
          <BookmarkIcon className="text-foreground size-4 [&_path]:stroke-current" />
          <Typography variant="paragraph-small-bold">Trusted Safes</Typography>
        </div>
      )}

      {pinnedSafes.length > 0 && (
        <section data-testid="pinned-accounts" className="mb-4">
          <div className="flex flex-col gap-2">
            {pinnedSafes.map((item) => (
              <AccountItem key={item.address} safe={item} onLinkClick={onLinkClick} />
            ))}
          </div>
          <div className="mt-3 flex justify-center">
            <Button variant="outline" size="sm" onClick={modal.open} data-testid="add-more-safes-button">
              Manage trusted Safes
            </Button>
          </div>
        </section>
      )}

      {showEmptyState && (
        <Typography
          data-testid="empty-safe-list"
          variant="paragraph-small"
          color="muted"
          align="center"
          className="py-6"
        >
          You don&apos;t have any safes yet
        </Typography>
      )}

      <TrustedSafesModal modal={modal} />
    </>
  )
}

export default AccountsList
