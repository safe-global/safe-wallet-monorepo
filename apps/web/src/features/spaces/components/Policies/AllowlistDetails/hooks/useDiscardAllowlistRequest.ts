import { usePoliciesDeleteConfigurationRequestV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { DISCARD_ERROR } from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/messages'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useCurrentSpaceId } from '../../../../public/hooks/useCurrentSpaceId'
import type { ActiveAllowlistPolicy } from '../../AllowlistDrawer/resolveState'

/** Deletes the change's stored request in CGW, so the row shows the rules in force again. Unset while it cannot. */
export const useDiscardAllowlistRequest = (policy: ActiveAllowlistPolicy): (() => Promise<void>) | undefined => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [deleteRequest, { isLoading }] = usePoliciesDeleteConfigurationRequestV1Mutation()
  const root = policy.scheduledChange?.root
  const { chainId, address: safeAddress } = policy.safe

  if (!spaceId || !root || isLoading) return undefined

  return async () => {
    try {
      await deleteRequest({ spaceId, chainId, safeAddress, root }).unwrap()
    } catch {
      dispatch(showNotification({ variant: 'error', message: DISCARD_ERROR, groupKey: 'allowlist-discard' }))
    }
  }
}
