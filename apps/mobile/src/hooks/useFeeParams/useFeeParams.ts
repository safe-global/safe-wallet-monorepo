import { useMemo } from 'react'
import { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { useDefaultGasPrice } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { getUserNonce, useWeb3ReadOnly } from '@/src/hooks/wallets/web3'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useGasLimit } from '@safe-global/utils/hooks/useDefaultGasLimit'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import useSafeTx from '@/src/hooks/useSafeTx'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export type FeeParams = {
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  gasLimit?: bigint
  nonce?: number
  isLoadingGasPrice: boolean
  gasLimitLoading: boolean
  gasLimitError?: Error
}

export interface UseFeeParamsSettings {
  pooling?: boolean
  logError?: (err: string) => void
}

export const useFeeParams = (
  txDetails: TransactionDetails,
  manualParams: EstimatedFeeValues | null,
  settings?: UseFeeParamsSettings,
): FeeParams => {
  const chain = useAppSelector(selectActiveChain)
  const provider = useWeb3ReadOnly()
  const [gasPrice, gasPriceError, isLoadingGasPrice] = useDefaultGasPrice(chain as Chain, provider, {
    withPooling: settings?.pooling ?? true,
    isSpeedUp: false,
    logError: settings?.logError,
  })
  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const [userNonce] = useAsync<number>(() => {
    return getUserNonce(activeSigner?.value ?? '')
  }, [activeSigner?.value])

  const safeInfoMapper = useAppSelector((state) => selectSafeInfo(state, activeSafe.address))
  const safeInfo = safeInfoMapper ? safeInfoMapper[activeSafe.chainId] : undefined
  const safeSDK = useSafeSDK()

  const safeTx = useSafeTx(txDetails)

  const { gasLimit, gasLimitLoading, gasLimitError } = useGasLimit({
    safeTx,
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
    threshold: safeInfo?.threshold ?? 0,
    walletAddress: activeSigner?.value ?? '',
    safeSDK,
    web3ReadOnly: provider,
    isOwner: true,
    logError: settings?.logError,
  })

  return useMemo(() => {
    if (manualParams) {
      return {
        maxFeePerGas: manualParams.maxFeePerGas,
        maxPriorityFeePerGas: manualParams.maxPriorityFeePerGas,
        gasLimit: manualParams.gasLimit,
        nonce: manualParams.nonce,
        isLoadingGasPrice,
        gasLimitLoading,
        gasLimitError,
      }
    }

    return {
      maxFeePerGas: gasPrice?.maxFeePerGas ?? undefined,
      maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas ?? undefined,
      gasLimit,
      nonce: userNonce,
      isLoadingGasPrice,
      gasLimitLoading,
      gasLimitError,
    }
  }, [gasPrice, gasPriceError, isLoadingGasPrice, gasLimitLoading, manualParams, gasLimit, userNonce])
}
