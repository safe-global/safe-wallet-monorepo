import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import {
  useDelegatesGetDelegatesV3Query,
  type DelegatesGetDelegatesV3ApiArg,
} from '@safe-global/store/gateway/delegates'

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

export const useIsWalletProposer = () => {
  const wallet = useWallet()
  const proposers = useProposers()

  return proposers.data?.results.some((proposer) => proposer.delegate === wallet?.address)
}

export default useProposers
