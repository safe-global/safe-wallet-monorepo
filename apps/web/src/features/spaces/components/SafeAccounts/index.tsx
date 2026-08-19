import AddAccountsChooser from '../AddAccountsChooser'
import EmptySafeAccounts from './EmptySafeAccounts'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Typography } from '@/components/ui/typography'
import { useMemo, useState } from 'react'
import { useAppSelector } from '@/store'
import { getSpaceOrderScope, OrderByOption, selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import {
  type AllSafeItems,
  type SafeItem,
  _groupAndSort,
  flattenSafeItems,
  useSafeOrderComparator,
  useSafesSearch,
  useSaveManualOrder,
} from '@/hooks/safes'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useSimilarityClusters } from '@/features/address-poisoning'
import { useSpaceSafes, useIsInvited, useIsAdmin, useCurrentSpaceId } from '@/features/spaces'
import { SafeAccountsTable } from '@/features/myAccounts'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { TriangleAlert, RotateCw, Search } from 'lucide-react'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_LABELS, SPACE_EVENTS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import SecurityBanner from '@/components/common/TrustedSafesModal/SecurityBanner'
import SpaceSafeContextMenu from './SpaceSafeContextMenu'

const SpaceSafeAccounts = () => {
  const { allSafes, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes } = useSpaceSafes()
  const isInvited = useIsInvited()
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const orderScope = spaceId ? getSpaceOrderScope(spaceId) : undefined

  // Use same organization logic as onboarding
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = useSafeOrderComparator(orderScope)
  const saveManualOrder = useSaveManualOrder(orderScope)

  // useSpaceSafes already resolves names via the merged (workspace-priority, local fallback) address
  // book, so flatten those items rather than rebuilding them — rebuilding via buildSafeItem would
  // re-derive the name from the local address book only and drop the workspace name.
  const spaceSafeItems = useMemo<SafeItem[]>(() => flattenSafeItems(allSafes ?? []), [allSafes])

  const spaceSafeAddresses = useMemo(() => spaceSafeItems.map((s) => s.address), [spaceSafeItems])
  const { flagged: similarAddresses, groupIdByAddress: similarityGroups } = useSimilarityClusters(spaceSafeAddresses)

  // Group and sort
  const displaySafes = useMemo<AllSafeItems>(
    () => _groupAndSort(spaceSafeItems, sortComparator),
    [spaceSafeItems, sortComparator],
  )

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 300)
  const filteredSafes = useSafesSearch(displaySafes, debouncedSearchQuery)
  const visibleSafes = debouncedSearchQuery ? filteredSafes : displaySafes

  const isSpaceEmpty = allSafes.length === 0

  return (
    <>
      {isInvited && <PreviewInvite />}
      <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
        Safe accounts
      </Typography>

      <div className="mb-6 flex items-center gap-4">
        {isAdmin && (
          <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.accounts_page}>
            <AddAccountsChooser buttonVariant="default" buttonLabel="Add accounts" entryPoint="safe_accounts" />
          </Track>
        )}
        {!isSpaceEmpty && !isSpaceSafesError && (
          <>
            <InputGroup variant="search" inputSize="lg" className="flex-1">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="by name, address or network"
                aria-label="Search Safe accounts by name, address or network"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                data-testid="space-safe-accounts-search-input"
              />
            </InputGroup>
            <SafeListSortToggle
              size="lg"
              className="border-border shadow-xs hover:bg-foreground/[0.06] aria-expanded:bg-foreground/[0.06]"
            />
          </>
        )}
      </div>

      {isSpaceSafesError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <TriangleAlert className="size-5 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-destructive">Failed to load Safe accounts</span>
            <span className="text-xs text-muted-foreground">
              {spaceSafesError ? getRtkQueryErrorMessage(spaceSafesError) : 'Please try again.'}
            </span>
          </div>
          <button
            onClick={refetchSpaceSafes}
            className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            type="button"
          >
            <RotateCw className="size-3.5" />
            Retry
          </button>
        </div>
      ) : isSpaceEmpty ? (
        <EmptySafeAccounts />
      ) : visibleSafes.length === 0 ? (
        <Typography variant="paragraph-small" color="muted" align="center" className="py-8">
          No Safe accounts match your search
        </Typography>
      ) : (
        <div className="flex flex-col gap-4">
          {similarAddresses.size > 0 && <SecurityBanner title="Verify before you trust" />}
          <SafeAccountsTable
            items={visibleSafes}
            // The table sits directly on the page background here, so the card outline is dropped.
            bordered={false}
            // Inside a workspace every Safe belongs to it, so the Workspaces column adds no information.
            columns={['name', 'threshold', 'networks', 'pending', 'balance', 'actions']}
            similarityGroups={similarityGroups}
            // Column sorting is only offered in Name mode; Last visited / Manual own the order.
            sortableColumns={orderBy === OrderByOption.NAME}
            renderActions={(line) =>
              line.variant === 'child' ? null : <SpaceSafeContextMenu safeItem={line.source} />
            }
            // Reorderable in every sort mode; suppressed while searching, where a drop would persist
            // only the filtered subset.
            reorder={!debouncedSearchQuery && orderScope ? { onReorder: saveManualOrder } : undefined}
          />
        </div>
      )}
    </>
  )
}

export default SpaceSafeAccounts
