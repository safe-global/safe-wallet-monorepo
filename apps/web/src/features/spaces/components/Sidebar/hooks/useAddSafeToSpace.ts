import { useState } from 'react'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import type { SpaceItem } from '../types'

interface UseAddSafeToSpaceOptions {
  spaces: SpaceItem[]
  onSpaceAdded?: (space: SpaceItem) => void
}

interface UseAddSafeToSpaceResult {
  addToSpace: (spaceId: number) => Promise<boolean>
  loadingSpaceId: number | null
}

export const useAddSafeToSpace = ({ spaces, onSpaceAdded }: UseAddSafeToSpaceOptions): UseAddSafeToSpaceResult => {
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const [addSafeToSpace] = useSpaceSafesCreateV1Mutation()
  const [loadingSpaceId, setLoadingSpaceId] = useState<number | null>(null)

  const addToSpace = async (spaceId: number): Promise<boolean> => {
    if (!chain?.chainId || !safe.address.value) return false
    setLoadingSpaceId(spaceId)
    try {
      const result = await addSafeToSpace({
        spaceId,
        createSpaceSafesDto: { safes: [{ chainId: chain.chainId, address: safe.address.value }] },
      })
      if (result.error) {
        dispatch(
          showNotification({
            message: 'Failed to add Safe to workspace.',
            variant: 'error',
            groupKey: 'add-safe-to-workspace-error',
          }),
        )
        return false
      }
      dispatch(
        showNotification({
          message: 'Successfully added Safe to workspoace.',
          variant: 'success',
          groupKey: 'add-safe-to-workspace-success',
        }),
      )
      const space = spaces.find((s) => s.id === spaceId)
      if (space) onSpaceAdded?.(space)
      return true
    } finally {
      setLoadingSpaceId(null)
    }
  }

  return { addToSpace, loadingSpaceId }
}
