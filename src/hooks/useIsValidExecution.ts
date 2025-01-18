import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { BigNumber } from 'ethers'
import type { EthersError } from '@/utils/ethers-utils'

import useAsync from './useAsync'
import ContractErrorCodes from '@/services/contracts/ContractErrorCodes'
import { type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { createWeb3, useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { type JsonRpcProvider } from '@ethersproject/providers'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import {
  getCurrentGnosisSafeContract,
  getReadOnlyCurrentGnosisSafeContract,
  getReadOnlyGnosisSafeContract,
} from '@/services/contracts/safeContracts'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { encodeSignatures } from '@/services/tx/encodeSignatures'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useTimelockAddress } from '@/hooks/hsgsuper/hsgsuper'
import { createReadOnlyEthersAdapter } from '@/hooks/coreSDK/safeCoreSDK'

const isContractError = (error: EthersError) => {
  if (!error.reason) return false

  return Object.keys(ContractErrorCodes).includes(error.reason)
}

// Monkey patch the signerProvider to proxy requests to the "readonly" provider if on the wrong chain
// This is ONLY used to check the validity of a transaction in `useIsValidExecution`
export const getPatchedSignerProvider = (
  wallet: ConnectedWallet,
  chainId: SafeInfo['chainId'],
  readOnlyProvider: JsonRpcProvider,
) => {
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
  gasLimit?: BigNumber,
): {
  isValidExecution?: boolean
  executionValidationError?: Error
  isValidExecutionLoading: boolean
} => {
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const readOnlyProvider = useWeb3ReadOnly()
  const isOwner = useIsSafeOwner()
  const timelock = useTimelockAddress()

  const [isValidExecution, executionValidationError, isValidExecutionLoading] = useAsync(async () => {
    if (!safeTx || !wallet || !gasLimit || !readOnlyProvider || !timelock) {
      return
    }

    try {
      // const provider = getPatchedSignerProvider(wallet, safe.chainId, readOnlyProvider)
      // const ethAdapter = createReadOnlyEthersAdapter(readOnlyProvider)
      const safeContract = getReadOnlyCurrentGnosisSafeContract(safe)

      /**
       * We need to call the contract directly instead of using `sdk.isValidTransaction`
       * because `gasLimit` errors are otherwise not propagated.
       * @see https://github.com/safe-global/safe-core-sdk/blob/main/packages/safe-ethers-lib/src/contracts/GnosisSafe/GnosisSafeContractEthers.ts#L126
       * This also fixes the over-fetching issue of the monkey patched provider.
       */
      return safeContract.contract.callStatic.execTransaction(
        safeTx.data.to,
        safeTx.data.value,
        safeTx.data.data,
        safeTx.data.operation,
        safeTx.data.safeTxGas,
        safeTx.data.baseGas,
        safeTx.data.gasPrice,
        safeTx.data.gasToken,
        safeTx.data.refundReceiver,
        encodeSignatures(safeTx, isOwner ? wallet.address : undefined),
        { from: timelock },
      )
    } catch (_err) {
      const err = _err as EthersError

      if (isContractError(err)) {
        console.log('useIsValidExec err: ', err)
        // @ts-ignore
        err.reason += `: ${ContractErrorCodes[err.reason]}`
      }

      throw err
    }
  }, [safeTx, wallet, gasLimit, safe, readOnlyProvider, isOwner, timelock])

  return { isValidExecution, executionValidationError, isValidExecutionLoading }
}

export default useIsValidExecution
