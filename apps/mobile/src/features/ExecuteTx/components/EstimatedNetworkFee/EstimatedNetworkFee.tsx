import React from 'react'
import { Text, View } from 'tamagui'
import { router } from 'expo-router'

import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { getUserNonce, useWeb3ReadOnly, } from '@/src/hooks/wallets/web3'
import { getTotalFee, useDefaultGasPrice } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { formatVisualAmount, safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { useGasLimit } from '@safe-global/utils/hooks/useDefaultGasLimit'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useSafeTx from '@/src/hooks/useSafeTx'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'

export const EstimatedNetworkFee = ({ txDetails }: { txDetails: TransactionDetails }) => {
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

  const onPress = () => {
    router.push({
      pathname: '/change-estimated-fee-sheet',
    })
  }

  return (
    <View flexDirection="row" justifyContent="space-between" gap="$2" alignItems="center">
      <Text color="$textSecondaryLight">Est. network fee</Text>

      {/* TODO: get the gas fee from the tx */}
      <View flexDirection="row" alignItems="center" onPress={onPress}>
        <View
          borderStyle="dashed"
          borderBottomWidth={1}
          borderColor="$color"
        >
          <Text fontWeight={700}>
            {totalFee} {chain?.nativeCurrency.symbol}
          </Text>
        </View>
      </View>
    </View>
  )
}
