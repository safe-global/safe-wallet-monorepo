import { useContext } from 'react'
import { useCounterpartyAnalysis as useCounterpartyAnalysisUtils } from '@safe-global/utils/features/safe-shield/hooks'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useOwnedSafes from '@/hooks/useOwnedSafes'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import type {
  RecipientAnalysisResults,
  ContractAnalysisResults,
  DeadlockAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'

/** `enabled=false` keeps the CGW call off (Pro-only feature) while still returning idle results. */
export function useCounterpartyAnalysis(
  overrideSafeTx?: SafeTransaction,
  enabled = true,
): {
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
} {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const web3ReadOnly = useWeb3ReadOnly()
  const mergedAddressBooks = useMergedAddressBooks(chainId)
  const ownedSafesByChain = useOwnedSafes(chainId)
  const { safeTx } = useContext(SafeTxContext)

  const ownedSafes = ownedSafesByChain[chainId] || []

  return useCounterpartyAnalysisUtils({
    safeAddress,
    chainId,
    safeTx: enabled ? overrideSafeTx || safeTx : undefined,
    isInAddressBook: mergedAddressBooks.has,
    ownedSafes,
    web3ReadOnly,
  })
}
