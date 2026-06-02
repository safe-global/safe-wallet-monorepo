import { useCallback } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import {
  useDelegatesGetDelegatesV3Query,
  useLazyDelegatesGetDelegatesV3Query,
  type DelegatesGetDelegatesV3ApiArg,
} from '@safe-global/store/gateway/delegates'
import type { DelegatePage } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'

const hasDelegate = ({ results }: DelegatePage, address: string | undefined) =>
  results.some((proposer) => proposer.delegate === address)

const useProposers = () => {
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()

  const shouldFetch = Boolean(chainId && safeAddress)

  const queryArg: DelegatesGetDelegatesV3ApiArg | undefined = shouldFetch ? { chainId, safe: safeAddress } : undefined

  return useDelegatesGetDelegatesV3Query(queryArg as DelegatesGetDelegatesV3ApiArg, {
    skip: !shouldFetch,
  })
}

// Awaits the delegates query, for callers that must answer once and cannot revise the answer later.
export const useGetIsWalletProposer = (): (() => Promise<boolean>) => {
  const wallet = useWallet()
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const { data } = useProposers()
  const [fetchProposers] = useLazyDelegatesGetDelegatesV3Query()

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
