import { useCallback } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  useDelegatesGetDelegatesV2Query,
  useDelegatesGetDelegatesV3Query,
  useLazyDelegatesGetDelegatesV2Query,
  useLazyDelegatesGetDelegatesV3Query,
  type DelegatesGetDelegatesV3ApiArg,
  type DelegatePage,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'

const hasDelegate = ({ results }: DelegatePage, address: string | undefined) =>
  results.some((proposer) => proposer.delegate === address)

const useProposers = () => {
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()

  const isQueueService = useHasFeature(FEATURES.QUEUE_SERVICE)
  const shouldFetch = Boolean(chainId && safeAddress) && isQueueService !== undefined

  const queryArg: DelegatesGetDelegatesV3ApiArg | undefined = shouldFetch ? { chainId, safe: safeAddress } : undefined

  const transactionServiceResult = useDelegatesGetDelegatesV2Query(queryArg as DelegatesGetDelegatesV3ApiArg, {
    skip: !shouldFetch || isQueueService,
  })
  const queueServiceResult = useDelegatesGetDelegatesV3Query(queryArg as DelegatesGetDelegatesV3ApiArg, {
    skip: !shouldFetch || !isQueueService,
  })

  return isQueueService ? queueServiceResult : transactionServiceResult
}

// Awaits the delegates query, for callers that must answer once and cannot revise the answer later.
export const useGetIsWalletProposer = (): (() => Promise<boolean>) => {
  const wallet = useWallet()
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const { data } = useProposers()
  const isQueueService = useHasFeature(FEATURES.QUEUE_SERVICE)
  const [fetchTransactionServiceProposers] = useLazyDelegatesGetDelegatesV2Query()
  const [fetchQueueServiceProposers] = useLazyDelegatesGetDelegatesV3Query()
  const fetchProposers = isQueueService ? fetchQueueServiceProposers : fetchTransactionServiceProposers

  const isProposer = data ? hasDelegate(data, wallet?.address) : undefined
  const walletAddress = wallet?.address

  return useCallback(async () => {
    if (isProposer !== undefined) return isProposer
    if (!walletAddress || !chainId || !safeAddress) return false

    try {
      return hasDelegate(await fetchProposers({ chainId, safe: safeAddress }, true).unwrap(), walletAddress)
    } catch {
      return false
    }
  }, [isProposer, walletAddress, chainId, safeAddress, fetchProposers])
}

export const useIsWalletProposer = () => {
  const wallet = useWallet()
  const { data } = useProposers()

  return data ? hasDelegate(data, wallet?.address) : undefined
}

export default useProposers
