import { useMemo } from 'react'
import { useGetBalancesQuery } from '@/src/store/signersBalance'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { toBigInt } from 'ethers'

interface UseExecutionFundsParams {
  signerAddress?: string
  totalFeeRaw: bigint
  executionMethod: ExecutionMethod
  chain?: Chain
}

interface UseExecutionFundsResult {
  hasSufficientFunds: boolean
  isCheckingFunds: boolean
  signerBalance?: bigint
}

/**
 * Hook to check if the active signer has sufficient funds to execute the transaction.
 * Skips the check if execution method is WITH_RELAY since no funds are needed from the signer.
 */
export const useExecutionFunds = ({
  signerAddress,
  totalFeeRaw,
  executionMethod,
  chain,
}: UseExecutionFundsParams): UseExecutionFundsResult => {
  // Skip balance check if executing with relay (no funds needed from signer)
  const shouldCheckBalance = executionMethod !== ExecutionMethod.WITH_RELAY && Boolean(signerAddress && chain)

  const { data: balances, isLoading } = useGetBalancesQuery(
    {
      addresses: signerAddress ? [signerAddress] : [],
      // Cast is safe because query is skipped when chain is undefined
      chain: (chain ?? {}) as Chain,
    },
    {
      skip: !shouldCheckBalance || !signerAddress || !chain,
    },
  )

  const result = useMemo<UseExecutionFundsResult>(() => {
    // If using relay, funds are not needed from signer
    if (executionMethod === ExecutionMethod.WITH_RELAY) {
      return {
        hasSufficientFunds: true,
        isCheckingFunds: false,
      }
    }

    // If still loading or no signer address
    if (isLoading || !signerAddress) {
      return {
        hasSufficientFunds: true, // Assume sufficient until we know otherwise
        isCheckingFunds: isLoading,
      }
    }

    // If no balance data available
    if (!balances || !balances[signerAddress]) {
      return {
        hasSufficientFunds: true, // Assume sufficient if we can't check
        isCheckingFunds: false,
      }
    }

    const signerBalance = toBigInt(balances[signerAddress])
    const hasSufficientFunds = signerBalance >= totalFeeRaw

    return {
      hasSufficientFunds,
      isCheckingFunds: false,
      signerBalance,
    }
  }, [executionMethod, isLoading, signerAddress, balances, totalFeeRaw])

  return result
}
