import type { SafeTransaction } from '@safe-global/types-kit'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { Errors, logError } from '@/services/exceptions'
import chains from '@safe-global/utils/config/chains'
import { useSigner } from './wallets/useWallet'
import { useSafeSDK } from './coreSDK/safeCoreSDK'
import useIsSafeOwner from './useIsSafeOwner'
import { isExpectedEstimationError } from '@/utils/transaction-errors'
import useSafeInfo from './useSafeInfo'
import {
  getEncodedSafeTx,
  GasMultipliers,
  incrementByGasMultiplier,
  getGasLimitForZkSync as getGasLimitForZkSyncUtil,
} from '@safe-global/utils/hooks/coreSDK/gasLimitUtils'

const useGasLimit = (
  safeTx?: SafeTransaction,
): {
  gasLimit?: bigint
  gasLimitError?: Error
  gasLimitLoading: boolean
} => {
  const safeSDK = useSafeSDK()
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe } = useSafeInfo()
  const safeAddress = safe.address.value
  const threshold = safe.threshold
  const wallet = useSigner()
  const walletAddress = wallet?.address
  const isOwner = useIsSafeOwner()
  const currentChainId = useChainId()
  const hasSafeTxGas = !!safeTx?.data?.safeTxGas

  const [gasLimit, gasLimitError, gasLimitLoading] = useAsync<bigint | undefined>(async () => {
    if (!safeAddress || !walletAddress || !safeSDK || !web3ReadOnly || !safeTx) return

    const encodedSafeTx = getEncodedSafeTx(
      safeSDK,
      safeTx,
      isOwner ? walletAddress : undefined,
      safeTx.signatures.size < threshold,
    )

    try {
      // if we are dealing with zksync and the walletAddress is a Safe, we have to do some magic
      // FIXME a new check to indicate ZKsync chain will be added to the config service and available under Chain
      if (
        (safe.chainId === chains.zksync || safe.chainId === chains.lens) &&
        (await web3ReadOnly.getCode(walletAddress)) !== '0x'
      ) {
        return await getGasLimitForZkSyncUtil(web3ReadOnly, safeSDK, safeTx, safe.chainId, safe.address.value)
      }

      const gasLimit = await web3ReadOnly.estimateGas({
        to: safeAddress,
        from: walletAddress,
        data: encodedSafeTx,
      })

      // Due to a bug in Nethermind estimation, we need to increment the gasLimit by 30%
      // when the safeTxGas is defined and not 0. Currently Nethermind is used only for Gnosis Chain.
      if (currentChainId === chains.gno && hasSafeTxGas) {
        return incrementByGasMultiplier(gasLimit, GasMultipliers[chains.gno])
      }

      return gasLimit
    } catch (e) {
      // A revert or a throttle is the estimate's expected answer, not a fault.
      if (!isExpectedEstimationError(e)) logError(Errors._612, e, getRpcErrorContext(web3ReadOnly))
      throw e
    }
  }, [
    safeAddress,
    walletAddress,
    safeSDK,
    web3ReadOnly,
    safeTx,
    isOwner,
    currentChainId,
    hasSafeTxGas,
    threshold,
    safe,
  ])

  return { gasLimit, gasLimitError, gasLimitLoading }
}

export default useGasLimit
