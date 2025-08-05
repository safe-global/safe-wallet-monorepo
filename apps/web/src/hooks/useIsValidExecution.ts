import type { SafeTransaction } from '@safe-global/types-kit'
import type { EthersError } from '@/utils/ethers-utils'

import useAsync from '@safe-global/utils/hooks/useAsync'
import ContractErrorCodes from '@/services/contracts/ContractErrorCodes'
import { type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { createWeb3, useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { type JsonRpcProvider } from 'ethers'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { getCurrentGnosisSafeContract } from '@/services/contracts/safeContracts'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import { type NestedWallet } from '@/utils/nested-safe-wallet'
import { assertProvider } from '@/utils/helpers'

const isContractError = (error: EthersError) => {
  if (!error.reason) return false

  return Object.keys(ContractErrorCodes).includes(error.reason)
}

// Monkey patch the signerProvider to proxy requests to the "readonly" provider if on the wrong chain
// This is ONLY used to check the validity of a transaction in `useIsValidExecution`
export const getPatchedSignerProvider = (
  wallet: ConnectedWallet | NestedWallet,
  chainId: SafeInfo['chainId'],
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

      if (isContractError(err)) {
        // @ts-ignore
        err.reason += `: ${ContractErrorCodes[err.reason]}`
      }

      throw err
    }
  }, [safeTx, wallet, gasLimit, safe, readOnlyProvider])

  return { isValidExecution, executionValidationError, isValidExecutionLoading }
}

export default useIsValidExecution
