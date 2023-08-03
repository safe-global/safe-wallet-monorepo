import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { BigNumber } from 'ethers'
import type { EthersError } from '@/utils/ethers-utils'

import useAsync from './useAsync'
import ContractErrorCodes from '@/services/contracts/ContractErrorCodes'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { createWeb3, createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { type ConnectedWallet } from '@/services/onboard'
import { getCurrentGnosisSafeContract } from '@/services/contracts/safeContracts'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { encodeSignatures } from '@/services/tx/encodeSignatures'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useCurrentChain } from './useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'

const isContractError = (error: EthersError) => {
  if (!error.reason) return false

  return Object.keys(ContractErrorCodes).includes(error.reason)
}

// Monkey patch the signerProvider to proxy requests to the "readonly" provider if on the wrong chain
// This is ONLY used to check the validity of a transaction in `useIsValidExecution`
const getPatchedSignerProvider = (wallet: ConnectedWallet, chain: ChainInfo, customRpc?: Record<string, string>) => {
  const signerProvider = createWeb3(wallet.provider)
  const readOnlyProvider = createWeb3ReadOnly(chain.rpcUri, customRpc?.[chain.chainId])

  if (wallet.chainId !== chain.chainId) {
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
  const chain = useCurrentChain()
  const customRpc = useAppSelector(selectRpc)
  const isOwner = useIsSafeOwner()

  const [isValidExecution, executionValidationError, isValidExecutionLoading] = useAsync(async () => {
    if (!safeTx || !wallet || !gasLimit || !chain) {
      return
    }

    try {
      const provider = getPatchedSignerProvider(wallet, chain, customRpc)
      const safeContract = getCurrentGnosisSafeContract(safe, provider)

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
        { from: wallet.address, gasLimit: gasLimit.toString() },
      )
    } catch (_err) {
      const err = _err as EthersError

      if (isContractError(err)) {
        // @ts-ignore
        err.reason += `: ${ContractErrorCodes[err.reason]}`
      }

      throw err
    }
  }, [safeTx, wallet, gasLimit, safe, isOwner])

  return { isValidExecution, executionValidationError, isValidExecutionLoading }
}

export default useIsValidExecution
