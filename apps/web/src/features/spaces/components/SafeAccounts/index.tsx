import AddAccountsChooser from '../AddAccountsChooser'
import EmptySafeAccounts from './EmptySafeAccounts'
import LocalSafeAccounts from './LocalSafeAccounts'
import { Stack } from '@mui/material'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import {
  type AllSafeItems,
  type SafeItem,
  _getMultiChainAccounts,
  _getSingleChainAccounts,
  getComparator,
  useSafeItemBuilder,
} from '@/hooks/safes'
import { getFlaggedSimilarAddressSet } from '@safe-global/utils/utils/addressSimilarity'
import { useSpaceSafes, useIsInvited } from '@/features/spaces'
import { SafeAccountsTable } from '@/features/myAccounts'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { TriangleAlert, RotateCw } from 'lucide-react'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_LABELS, SPACE_EVENTS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import SimilarAddressAlert from '@/components/common/SimilarAddressAlert'
import SpaceSafeContextMenu from './SpaceSafeContextMenu'

const _groupAndSort = (
  items: SafeItem[],
  sortComparator: (a: AllSafeItems[number], b: AllSafeItems[number]) => number,
): AllSafeItems => {
  const multi = _getMultiChainAccounts(items)
  const single = _getSingleChainAccounts(items, multi)
  return [...multi, ...single].sort(sortComparator)
}

const SpaceSafeAccounts = () => {
  const { allSafes, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes } = useSpaceSafes()
  const isInvited = useIsInvited()

  // Use same organization logic as onboarding
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)
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

  const hasResults = displaySafes.length > 0

  return (
    <>
      {isInvited && <PreviewInvite />}
      <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
        Safe accounts
      </Typography>

      <Tabs defaultValue="workspace">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="local">Trusted</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <Stack direction="row" justifyContent="flex-start" sx={{ mb: 3 }}>
            <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.accounts_page}>
              <AddAccountsChooser buttonVariant="default" buttonLabel="Manage accounts" entryPoint="safe_accounts" />
            </Track>
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
          ) : !hasResults && allSafes && allSafes.length === 0 ? (
            <EmptySafeAccounts />
          ) : (
            <>
              {similarAddresses.size > 0 && <SimilarAddressAlert />}
              <SafeAccountsTable
                items={displaySafes}
                flaggedAddresses={similarAddresses}
                renderActions={(line) =>
                  line.variant === 'child' ? null : <SpaceSafeContextMenu safeItem={line.source} />
                }
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="local">
          <LocalSafeAccounts />
        </TabsContent>
      </Tabs>
    </>
  )
}

export default SpaceSafeAccounts
