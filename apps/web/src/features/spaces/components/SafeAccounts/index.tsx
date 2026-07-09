import AddAccountsChooser from '../AddAccountsChooser'
import EmptySafeAccounts from './EmptySafeAccounts'
import { Stack } from '@mui/material'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Typography } from '@/components/ui/typography'
import { useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  getSpaceOrderScope,
  OrderByOption,
  selectOrderByPreference,
  setManualOrder,
} from '@/store/orderByPreferenceSlice'
import {
  type AllSafeItems,
  _groupAndSort,
  useSafeItemBuilder,
  useSafeOrderComparator,
  useSafesSearch,
} from '@/hooks/safes'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { getFlaggedSimilarAddressSet } from '@safe-global/utils/utils/addressSimilarity'
import { useSpaceSafes, useIsInvited, useIsAdmin, useCurrentSpaceId } from '@/features/spaces'
import { SafeAccountsTable } from '@/features/myAccounts'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { useDarkMode } from '@/hooks/useDarkMode'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { TriangleAlert, RotateCw, Search } from 'lucide-react'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_LABELS, SPACE_EVENTS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import SimilarAddressAlert from '@/components/common/SimilarAddressAlert'
import SpaceSafeContextMenu from './SpaceSafeContextMenu'

const SpaceSafeAccounts = () => {
  const { allSafes, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes } = useSpaceSafes()
  const isInvited = useIsInvited()
  const isAdmin = useIsAdmin()
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()
  const spaceId = useCurrentSpaceId()
  const orderScope = spaceId ? getSpaceOrderScope(spaceId) : undefined

  // Use same organization logic as onboarding
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = useSafeOrderComparator(orderScope)
  const isManualOrder = orderBy === OrderByOption.MANUAL
  const { buildSafeItem } = useSafeItemBuilder()

  const spaceSafeItems = useMemo(() => {
    // Only include safes that are part of the current space
    const spaceSafes = allSafes?.flatMap((item) => ('safes' in item ? item.safes : [item])) || []

    return spaceSafes.map((safe) => buildSafeItem(safe.chainId, safe.address))
  }, [buildSafeItem, allSafes])

  const similarAddresses = useMemo<Set<string>>(
    () => getFlaggedSimilarAddressSet(spaceSafeItems.map((s) => s.address)),
    [spaceSafeItems],
  )

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

      <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
        {isAdmin && (
          <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.accounts_page}>
            <AddAccountsChooser buttonVariant="default" buttonLabel="Add accounts" entryPoint="safe_accounts" />
          </Track>
        )}
        {!isSpaceEmpty && !isSpaceSafesError && (
          <>
            <InputGroup className="flex-1 rounded-md bg-card">
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
            <ShadcnProvider dark={isDarkMode} className="flex items-center">
              <SafeListSortToggle />
            </ShadcnProvider>
          </>
        )}
      </Stack>

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
        <>
          {similarAddresses.size > 0 && <SimilarAddressAlert />}
          {isManualOrder && !debouncedSearchQuery && (
            <Typography variant="paragraph-small" color="muted" className="mb-2">
              Drag the handle on any row to arrange accounts your way — your order is saved automatically.
            </Typography>
          )}
          <SafeAccountsTable
            items={visibleSafes}
            // Inside a workspace every Safe belongs to it, so the Workspaces column adds no information.
            columns={['name', 'threshold', 'networks', 'pending', 'balance', 'actions']}
            flaggedAddresses={similarAddresses}
            renderActions={(line) =>
              line.variant === 'child' ? null : <SpaceSafeContextMenu safeItem={line.source} />
            }
            reorder={
              isManualOrder && !debouncedSearchQuery && orderScope
                ? { onReorder: (order) => dispatch(setManualOrder({ scope: orderScope, order })) }
                : undefined
            }
          />
        </>
      )}
    </>
  )
}

export default SpaceSafeAccounts
