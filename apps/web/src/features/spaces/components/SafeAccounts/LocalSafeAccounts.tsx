import { useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type AllSafeItems, isMultiChainSafeItem, useAllSafesGrouped } from '@/hooks/safes'
import useLocalAccountsView from '@/hooks/useLocalAccountsView'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import AddTrustedSafesCard from '@/components/common/AddTrustedSafesCard'
import TrustedSafesModal from '@/components/common/TrustedSafesModal'
import useTrustedSafesModal from '@/components/common/TrustedSafesModal/useTrustedSafesModal'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SafeCardReadOnly from './SafeCardReadOnly'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import { useCurrentSpaceId } from '../../hooks/useCurrentSpaceId'

const safeKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`

const AddToWorkspaceButton = ({ added, loading, onAdd }: { added: boolean; loading: boolean; onAdd: () => void }) => (
  <Button
    variant={added ? 'ghost' : 'outline'}
    size="sm"
    disabled={added || loading}
    onClick={onAdd}
    data-testid="add-to-workspace-button"
  >
    {added ? 'Already added' : 'Add to workspace'}
  </Button>
)

/**
 * The "Local safe accounts" tab of the workspace Safe accounts page: the user's
 * trusted (local-storage) safes, with the same columns as the workspace tab plus
 * a per-row "Add to workspace" action and a "Manage trusted Safes" button.
 */
const LocalSafeAccounts = () => {
  const localView = useLocalAccountsView()
  const modal = useTrustedSafesModal()
  const connectWallet = useConnectWallet()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const [addSafeToSpace] = useSpaceSafesCreateV1Mutation()
  const [addingKey, setAddingKey] = useState<string | null>(null)

  const grouped = useAllSafesGrouped()
  const pinnedSafes = useMemo<AllSafeItems>(
    () => [...(grouped.allMultiChainSafes ?? []), ...(grouped.allSingleSafes ?? [])].filter((safe) => safe.isPinned),
    [grouped.allMultiChainSafes, grouped.allSingleSafes],
  )

  const { allSafes: spaceSafes } = useSpaceSafes()
  const spaceMembership = useMemo(() => {
    const set = new Set<string>()
    spaceSafes.forEach((item) => {
      const underlying = isMultiChainSafeItem(item) ? item.safes : [item]
      underlying.forEach((safe) => set.add(safeKey(safe.chainId, safe.address)))
    })
    return set
  }, [spaceSafes])

  const handleAdd = async (key: string, safes: { chainId: string; address: string }[]) => {
    if (!spaceId) return
    setAddingKey(key)
    try {
      const result = await addSafeToSpace({ spaceId, createSpaceSafesDto: { safes } })
      if ('error' in result && result.error) {
        dispatch(
          showNotification({
            message: `Failed to add Safe to workspace. ${getRtkQueryErrorMessage(result.error)}`,
            variant: 'error',
            groupKey: 'add-safe-to-workspace-error',
          }),
        )
        return
      }
      dispatch(
        showNotification({
          message: 'Successfully added Safe to workspace.',
          variant: 'success',
          groupKey: 'add-safe-to-workspace-success',
        }),
      )
      trackEvent({ ...SPACE_EVENTS.WORKSPACE_SAFE_LINKED, label: spaceId })
    } finally {
      setAddingKey(null)
    }
  }

  if (localView === 'connect-wallet') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border bg-card p-6" data-testid="local-connect-wallet">
        <p className="text-sm text-muted-foreground">Connect your wallet to view your local Safe accounts.</p>
        <Button variant="outline" size="sm" onClick={connectWallet}>
          <Wallet className="size-4" /> Connect wallet
        </Button>
      </div>
    )
  }

  if (localView === 'add-trusted') {
    return (
      <>
        <AddTrustedSafesCard onAdd={modal.open} />
        <TrustedSafesModal modal={modal} />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {pinnedSafes.map((safe) => {
        const underlying = isMultiChainSafeItem(safe) ? safe.safes : [safe]
        const key = isMultiChainSafeItem(safe) ? `multi-${safe.address}` : safeKey(safe.chainId, safe.address)
        const added = underlying.every((item) => spaceMembership.has(safeKey(item.chainId, item.address)))
        return (
          <SafeCardReadOnly
            key={key}
            safe={safe}
            hideContextMenu
            showPending={false}
            action={
              <AddToWorkspaceButton
                added={added}
                loading={addingKey === key}
                onAdd={() =>
                  handleAdd(
                    key,
                    underlying.map((item) => ({ chainId: item.chainId, address: item.address })),
                  )
                }
              />
            }
          />
        )
      })}
      <div className="mt-3 flex justify-center">
        <Button variant="outline" size="sm" onClick={modal.open} data-testid="manage-trusted-safes-button">
          Manage trusted Safes
        </Button>
      </div>
      <TrustedSafesModal modal={modal} />
    </div>
  )
}

export default LocalSafeAccounts
