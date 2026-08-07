import { useState } from 'react'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { SpaceItem } from '../types'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

interface UseAddSafeToSpaceOptions {
  spaces: SpaceItem[]
  onSpaceAdded?: (space: SpaceItem) => void
}

interface UseAddSafeToSpaceResult {
  addToSpace: (spaceId: string) => Promise<boolean>
  loadingSpaceId: string | null
}

export const useAddSafeToSpace = ({ spaces, onSpaceAdded }: UseAddSafeToSpaceOptions): UseAddSafeToSpaceResult => {
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const [addSafeToSpace] = useSpaceSafesCreateV1Mutation()
  const [loadingSpaceId, setLoadingSpaceId] = useState<string | null>(null)

  const showError = (detail: string) =>
    dispatch(
      showNotification({
        message: `Failed to add Safe to workspace. ${detail}`,
        variant: 'error',
        groupKey: 'add-safe-to-workspace-error',
      }),
    )

  const addToSpace = async (spaceId: string): Promise<boolean> => {
    if (!chain?.chainId || !safe.address.value) return false
    setLoadingSpaceId(spaceId)
    try {
      const result = await addSafeToSpace({
        spaceId,
        createSpaceSafesDto: { safes: [{ chainId: chain.chainId, address: safe.address.value }] },
      })
      if (result.error) {
        showError(getRtkQueryErrorMessage(result.error))
        return false
      }
      dispatch(
        showNotification({
          message: 'Successfully added Safe to workspace.',
          variant: 'success',
          groupKey: 'add-safe-to-workspace-success',
        }),
      )
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_SAFE_LINKED, label: spaceId },
        { workspace_id: spaceId, safe_address: safe.address.value, chain_id: chain.chainId },
      )
      const space = spaces.find((s) => s.uuid === spaceId)
      if (space) onSpaceAdded?.(space)
      return true
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : '')
      return false
    } finally {
      setLoadingSpaceId(null)
    }
  }

  return { addToSpace, loadingSpaceId }
}
