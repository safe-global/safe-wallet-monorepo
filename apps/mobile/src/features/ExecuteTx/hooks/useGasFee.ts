import React from 'react'

import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import {  useWeb3ReadOnly, } from '@/src/hooks/wallets/web3'
import { getTotalFee, useDefaultGasPrice } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { useGasLimit } from '@safe-global/utils/hooks/useDefaultGasLimit'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useSafeTx from '@/src/hooks/useSafeTx'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'

const useGasFee = (txDetails: TransactionDetails) => {
    const chain = useAppSelector(selectActiveChain)
    const activeSafe = useDefinedActiveSafe()
    const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
    const safeInfoMapper = useAppSelector((state) => selectSafeInfo(state, activeSafe.address))
    const safeInfo = safeInfoMapper ? safeInfoMapper[activeSafe.chainId] : undefined
    const provider = useWeb3ReadOnly()
    const safeSDK = useSafeSDK()
    const [gasPrice, _gasPriceError, isLoading] = useDefaultGasPrice(chain as Chain, provider)
  
    const safeTx = useSafeTx(txDetails)
  
    const { gasLimit, gasLimitLoading } = useGasLimit({
      safeTx,
      chainId: activeSafe.chainId,
      safeAddress: activeSafe.address,
      threshold: safeInfo?.threshold ?? 0,
      walletAddress: activeSigner?.value ?? '',
      safeSDK,
      web3ReadOnly: provider,
      isOwner: true,
      logError: () => { },
    })
  
    // const [userNonce] = useAsync<number>(() => {
    //   return getUserNonce(activeSigner?.value ?? '')
    // }, [activeSigner?.value])
  
    const totalFee = !isLoading && !gasLimitLoading
      ? formatVisualAmount(getTotalFee(gasPrice?.maxFeePerGas ?? 0n, gasLimit ?? 0n), chain?.nativeCurrency.decimals)
      : 'loading...'

    return totalFee
}

export default useGasFee