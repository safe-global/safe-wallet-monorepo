import { useMemo } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { EthersError } from '@/utils/ethers-utils'

import useAsync from '@safe-global/utils/hooks/useAsync'
import { getContractErrorMessage, isGsCode } from '@safe-global/utils/services/exceptions/contractErrors'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { createWeb3, useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { type JsonRpcProvider, ZeroAddress } from 'ethers'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { getCurrentGnosisSafeContract } from '@/services/contracts/safeContracts'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBalances from '@/hooks/useBalances'
import { useCurrentChain } from '@/hooks/useChains'
import { useSigner } from '@/hooks/wallets/useWallet'
import { type NestedWallet } from '@/utils/nested-safe-wallet'
import { assertProvider } from '@/utils/helpers'

// Monkey patch the signerProvider to proxy requests to the "readonly" provider if on the wrong chain
// This is ONLY used to check the validity of a transaction in `useIsValidExecution`
export const getPatchedSignerProvider = (
  wallet: ConnectedWallet | NestedWallet,
  chainId: SafeState['chainId'],
  readOnlyProvider: JsonRpcProvider,
) => {
  assertProvider(wallet.provider)

  const signerProvider = createWeb3(wallet.provider)

  if (wallet.chainId !== chainId) {
    // The RPC methods that are used when we call contract.callStatic.execTransaction
    const READ_ONLY_METHODS = ['eth_chainId', 'eth_call']
    const ETH_ACCOUNTS_METHOD = 'eth_accounts'

    const originalSend = signerProvider.send

    signerProvider.send = (request, ...args) => {
      if (READ_ONLY_METHODS.includes(request)) {
        return readOnlyProvider.send.call(readOnlyProvider, request, ...args)
      }
      if (request === ETH_ACCOUNTS_METHOD) {
        return originalSend.call(signerProvider, request, ...args)
      }
      throw new Error('Invalid execution validity request')
    }
  }

  return signerProvider
}

const useIsValidExecution = (
  safeTx?: SafeTransaction,
  gasLimit?: bigint,
): {
  isValidExecution?: boolean
  executionValidationError?: Error
  isValidExecutionLoading: boolean
} => {
  const wallet = useSigner()
  const { safe } = useSafeInfo()
  const readOnlyProvider = useWeb3ReadOnly()
  const chain = useCurrentChain()
  const { balances } = useBalances()

  // GS012 pays the network fee in an ERC-20 gas token; resolve its symbol so the
  // message reads e.g. "Not enough USDC ..." instead of "{token}". Derived here as
  // a string so balance polling doesn't re-trigger the simulation below.
  const gasToken = safeTx?.data.gasToken
  const gasTokenSymbol = useMemo(
    () =>
      gasToken && !sameAddress(gasToken, ZeroAddress)
        ? balances.items.find((item) => sameAddress(item.tokenInfo.address, gasToken))?.tokenInfo.symbol
        : undefined,
    [gasToken, balances],
  )

  const [isValidExecution, executionValidationError, isValidExecutionLoading] = useAsync(async () => {
    if (!safeTx || !wallet || gasLimit === undefined || !readOnlyProvider) {
      return
    }

    try {
      const safeContract = await getCurrentGnosisSafeContract(safe, readOnlyProvider._getConnection().url)

      /**
       * We need to call the contract directly instead of using `sdk.isValidTransaction`
       * because `gasLimit` errors are otherwise not propagated.
       * @see https://github.com/safe-global/safe-core-sdk/blob/main/packages/safe-ethers-lib/src/contracts/GnosisSafe/GnosisSafeContractEthers.ts#L126
       * This also fixes the over-fetching issue of the monkey patched provider.
       */
      return safeContract.isValidTransaction(safeTx, { from: wallet.address, gasLimit: gasLimit.toString() })
    } catch (_err) {
      const err = _err as EthersError

      // Map a known on-chain (GS) revert reason to its user-facing message from
      // the shared source. The raw GS code stays out of the message; it belongs
      // in the support reference (Details panel).
      if (isGsCode(err.reason)) {
        err.reason = getContractErrorMessage(err.reason, {
          nativeAsset: chain?.nativeCurrency.symbol,
          token: gasTokenSymbol,
        }) as EthersError['reason']
      }

      throw err
    }
  }, [safeTx, wallet, gasLimit, safe, readOnlyProvider, chain, gasTokenSymbol])

  return { isValidExecution, executionValidationError, isValidExecutionLoading }
}

export default useIsValidExecution
