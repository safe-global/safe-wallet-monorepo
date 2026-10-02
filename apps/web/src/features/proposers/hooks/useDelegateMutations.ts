import { useCallback } from 'react'
import {
  useDelegatesDeleteDelegateV2Mutation,
  useDelegatesDeleteDelegateV3Mutation,
  useDelegatesPostDelegateV2Mutation,
  useDelegatesPostDelegateV3Mutation,
  type DelegatesPostDelegateV3ApiArg,
  type DeleteDelegateV3Dto,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'

type DeleteDelegateArg = {
  chainId: string
  delegateAddress: string
  deleteDelegateDto: DeleteDelegateV3Dto
}

/** Delegate create/delete against the queue service (v3) on chains with `QUEUE_SERVICE`, the transaction service (v2) otherwise. */
export const useDelegateMutations = () => {
  const isQueueService = useHasFeature(FEATURES.QUEUE_SERVICE)
  const [addDelegateV2] = useDelegatesPostDelegateV2Mutation()
  const [addDelegateV3] = useDelegatesPostDelegateV3Mutation()
  const [deleteDelegateV2] = useDelegatesDeleteDelegateV2Mutation()
  const [deleteDelegateV3] = useDelegatesDeleteDelegateV3Mutation()

  const addDelegate = useCallback(
    (arg: DelegatesPostDelegateV3ApiArg) => (isQueueService ? addDelegateV3(arg) : addDelegateV2(arg)).unwrap(),
    [isQueueService, addDelegateV2, addDelegateV3],
  )

  const deleteDelegate = useCallback(
    ({ chainId, delegateAddress, deleteDelegateDto }: DeleteDelegateArg) =>
      (isQueueService
        ? deleteDelegateV3({ chainId, delegateAddress, deleteDelegateV3Dto: deleteDelegateDto })
        : deleteDelegateV2({ chainId, delegateAddress, deleteDelegateV2Dto: deleteDelegateDto })
      ).unwrap(),
    [isQueueService, deleteDelegateV2, deleteDelegateV3],
  )

  return { addDelegate, deleteDelegate }
}
