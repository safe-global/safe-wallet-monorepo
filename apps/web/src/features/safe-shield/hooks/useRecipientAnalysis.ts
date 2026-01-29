import { type RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useRecipientAnalysis as useRecipientAnalysisUtils } from '@safe-global/utils/features/safe-shield/hooks'
import useOwnedSafes from '@/hooks/useOwnedSafes'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'

export function useRecipientAnalysis(
  recipients: string[] | undefined,
): AsyncResult<RecipientAnalysisResults> | undefined {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const web3ReadOnly = useWeb3ReadOnly()
  const mergedAddressBooks = useMergedAddressBooks(chainId)
  const ownedSafesByChain = useOwnedSafes(chainId)

  const ownedSafes = ownedSafesByChain[chainId] || []

  return useRecipientAnalysisUtils({
    recipients,
    safeAddress,
    chainId,
    web3ReadOnly,
    ownedSafes,
    isInAddressBook: mergedAddressBooks.has,
  })
}
