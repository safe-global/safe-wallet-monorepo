import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import {
  useDelegatesGetDelegatesV2Query,
  type DelegatesGetDelegatesV2ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'

const useProposers = () => {
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()

  const shouldFetch = Boolean(chainId && safeAddress)

  const queryArg: DelegatesGetDelegatesV2ApiArg | undefined = shouldFetch ? { chainId, safe: safeAddress } : undefined

  return useDelegatesGetDelegatesV2Query(queryArg as DelegatesGetDelegatesV2ApiArg, {
    skip: !shouldFetch,
  })
}

export const useIsWalletProposer = () => {
  const wallet = useWallet()
  const proposers = useProposers()

  return proposers.data?.results.some((proposer) => proposer.delegate === wallet?.address)
}

export default useProposers
