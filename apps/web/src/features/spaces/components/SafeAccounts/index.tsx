import { useState } from 'react'
import { TriangleAlert, RotateCw, ListChecks } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { useSpaceSafes, useIsInvited, useCurrentSpaceId, useIsAdmin } from '@/features/spaces'
import { isMultiChainSafeItem, type AllSafeItems, type MultiChainSafeItem, type SafeItem } from '@/hooks/safes'
import {
  useSpaceSafesCreateV1Mutation,
  useSpaceSafesDeleteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { trackEvent } from '@/services/analytics'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_LABELS, SPACE_EVENTS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import AddAccountsChooser from '../AddAccountsChooser'
import { MyAccountsFeature } from '@/features/myAccounts'
import { useLoadFeature } from '@/features/__core__'

const toSafeAccounts = (items: AllSafeItems) =>
  items.flatMap((item) =>
    isMultiChainSafeItem(item)
      ? item.safes.map((safe) => ({ chainId: safe.chainId, address: safe.address }))
      : [{ chainId: item.chainId, address: item.address }],
  )

const SpaceSafeAccounts = () => {
  const {
    allSafes: workspaceSafes,
    isError: isSpaceSafesError,
    error: spaceSafesError,
    refetch: refetchSpaceSafes,
  } = useSpaceSafes()
  const isInvited = useIsInvited()
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [removeSafeAccounts] = useSpaceSafesDeleteV1Mutation()
  const [addSafesToSpace] = useSpaceSafesCreateV1Mutation()

  const { SafesTable } = useLoadFeature(MyAccountsFeature)

  const [manageMode, setManageMode] = useState(false)

  const handleAddToWorkspace = async (item: SafeItem | MultiChainSafeItem) => {
    const safes = toSafeAccounts([item])
    const result = await addSafesToSpace({ spaceId: spaceId ?? '', createSpaceSafesDto: { safes } })

    if ('error' in result) {
      dispatch(showNotification({ message: 'Failed to add Safe to workspace', variant: 'error', groupKey: '' }))
      return
    }

    dispatch(showNotification({ message: 'Added Safe to workspace', variant: 'success', groupKey: '' }))
    refetchSpaceSafes()
  }

  const handleRemoveFromWorkspace = async (items: AllSafeItems) => {
    const safes = toSafeAccounts(items)
    trackEvent({ ...SPACE_EVENTS.DELETE_ACCOUNT })

    const result = await removeSafeAccounts({ spaceId: spaceId ?? '', deleteSpaceSafesDto: { safes } })

    if ('error' in result) {
      dispatch(showNotification({ message: 'Failed to remove Safes from workspace', variant: 'error', groupKey: '' }))
      return
    }

    safes.forEach(({ chainId, address }) =>
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_SAFE_UNLINKED, label: spaceId },
        { workspace_id: spaceId, safe_address: address, chain_id: chainId },
      ),
    )
    dispatch(
      showNotification({
        message: `Removed ${safes.length} Safe account${safes.length === 1 ? '' : 's'} from workspace`,
        variant: 'success',
        groupKey: '',
      }),
    )
    setManageMode(false)
    refetchSpaceSafes()
  }

  return (
    <>
      {isInvited && <PreviewInvite />}
      <div className="mb-6">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          Safe accounts
        </Typography>
      </div>

      {isSpaceSafesError ? (
        <div className="border-destructive/30 bg-destructive/5 flex items-center gap-3 rounded-2xl border px-5 py-4">
          <TriangleAlert className="text-destructive size-5 shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="text-destructive text-sm font-medium">Failed to load Safe accounts</span>
            <span className="text-muted-foreground text-xs">
              {spaceSafesError ? getRtkQueryErrorMessage(spaceSafesError) : 'Please try again.'}
            </span>
          </div>
          <button
            onClick={refetchSpaceSafes}
            className="text-destructive hover:bg-destructive/10 ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors"
            type="button"
          >
            <RotateCw className="size-3.5" />
            Retry
          </button>
        </div>
      ) : (
        <SafesTable
          workspaceSafes={workspaceSafes}
          manageMode={manageMode}
          onRemoveFromWorkspace={handleRemoveFromWorkspace}
          canAddToWorkspace={isAdmin}
          onAddToWorkspace={handleAddToWorkspace}
          headerActions={(tab, setTab) => (
            <>
              <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.accounts_page}>
                <AddAccountsChooser
                  mode="add"
                  buttonVariant="default"
                  buttonLabel="Add new Safe"
                  entryPoint="safe_accounts"
                  onShowLocalSafes={tab === 'workspace' ? () => setTab('local') : undefined}
                />
              </Track>

              {/* "Manage Safes" (workspace multiselect/remove) only applies to the Workspace tab. */}
              {tab === 'workspace' && (
                <Button
                  size="lg"
                  variant={manageMode ? 'default' : 'outline'}
                  className="font-normal"
                  onClick={() => setManageMode((prev) => !prev)}
                  data-testid="manage-safes-btn"
                >
                  {manageMode ? 'Done' : <ListChecks className="size-4" />}
                  {manageMode ? null : 'Manage Safes'}
                </Button>
              )}
            </>
          )}
        />
      )}
    </>
  )
}

export default SpaceSafeAccounts
