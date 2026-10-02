import { useCallback } from 'react'
import {
  useDelegatesDeleteDelegateV2Mutation,
  useDelegatesDeleteDelegateV3Mutation,
  useDelegatesPostDelegateV2Mutation,
  useDelegatesPostDelegateV3Mutation,
  type CreateDelegateDto,
  type DeleteDelegateV3Dto,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

type DelegateChain = Pick<Chain, 'chainId' | 'features'>

type AddDelegateArg = {
  chain: DelegateChain
  createDelegateDto: CreateDelegateDto
}

type DeleteDelegateArg = {
  chain: DelegateChain
  delegateAddress: string
  deleteDelegateDto: DeleteDelegateV3Dto
}

/** Delegate create/delete against the queue service (v3) on chains with `QUEUE_SERVICE`, the transaction service (v2) otherwise. */
export const useDelegateMutations = () => {
  const [addDelegateV2] = useDelegatesPostDelegateV2Mutation()
  const [addDelegateV3] = useDelegatesPostDelegateV3Mutation()
  const [deleteDelegateV2] = useDelegatesDeleteDelegateV2Mutation()
  const [deleteDelegateV3] = useDelegatesDeleteDelegateV3Mutation()

  const addDelegate = useCallback(
    ({ chain, createDelegateDto }: AddDelegateArg) => {
      const arg = { chainId: chain.chainId, createDelegateDto }
      return (hasFeature(chain, FEATURES.QUEUE_SERVICE) ? addDelegateV3(arg) : addDelegateV2(arg)).unwrap()
    },
    [addDelegateV2, addDelegateV3],
  )

  const deleteDelegate = useCallback(
    ({ chain, delegateAddress, deleteDelegateDto }: DeleteDelegateArg) => {
      const { chainId } = chain
      return (
        hasFeature(chain, FEATURES.QUEUE_SERVICE)
          ? deleteDelegateV3({ chainId, delegateAddress, deleteDelegateV3Dto: deleteDelegateDto })
          : deleteDelegateV2({ chainId, delegateAddress, deleteDelegateV2Dto: deleteDelegateDto })
      ).unwrap()
    },
    [deleteDelegateV2, deleteDelegateV3],
  )

  return { addDelegate, deleteDelegate }
}
