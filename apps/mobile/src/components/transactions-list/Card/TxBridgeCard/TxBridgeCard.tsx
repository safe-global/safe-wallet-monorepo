import { SafeListItem } from '@/src/components/SafeListItem'
import { Text, Theme, View } from 'tamagui'
import { ellipsis } from '@/src/utils/formatters'
import { TokenIcon } from '@/src/components/TokenIcon'
import React from 'react'
import { BridgeAndSwapTransactionInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatUnits } from 'ethers'
import { ChainIndicator } from '@/src/components/ChainIndicator'

interface TxBridgeCardProps {
  txInfo: BridgeAndSwapTransactionInfo
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export function TxBridgeCard({ txInfo, bordered, executionInfo, inQueue, onPress }: TxBridgeCardProps) {
  const actualFromAmount =
    BigInt(txInfo.fromAmount) + BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n)

  const fromAmountFormatted = formatUnits(actualFromAmount, txInfo.fromToken.decimals)
  const toAmountFormatted =
    txInfo.toAmount && txInfo.toToken ? formatUnits(txInfo.toAmount, txInfo.toToken.decimals) : ''

  const statusText = (() => {
    switch (txInfo.status) {
      case 'PENDING':
      case 'AWAITING_EXECUTION':
        return 'Pending'
      case 'FAILED':
        return 'Failed'
      case 'DONE':
        return 'Completed'
      default:
        return 'Bridge'
    }
  })()

  return (
    <SafeListItem
      label={
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text>{txInfo.fromToken.symbol}</Text>
          <View flexDirection="row" alignItems="center" gap="$2">
            <Text>→</Text>
            {txInfo.toToken?.symbol && <Text>{txInfo.toToken?.symbol}</Text>}
            <ChainIndicator chainId={txInfo.toChain} onlyLogo={!!txInfo.toToken} imageSize="$4" />
          </View>
        </View>
      }
      icon="transaction-swap"
      type={`${statusText} bridge`}
      executionInfo={executionInfo}
      bordered={bordered}
      onPress={onPress}
      inQueue={inQueue}
      leftNode={
        <Theme name="logo">
          <View position="relative" width="$10" height="$10">
            <View position="absolute" top={0}>
              <TokenIcon
                logoUri={txInfo.fromToken.logoUri}
                accessibilityLabel={txInfo.fromToken.name}
                size="$7"
                imageBackground="$background"
              />
            </View>
            {txInfo.toToken && (
              <View position="absolute" bottom={0} right={0}>
                <TokenIcon
                  logoUri={txInfo.toToken.logoUri}
                  accessibilityLabel={txInfo.toToken.name}
                  size="$7"
                  imageBackground="$background"
                />
              </View>
            )}
          </View>
        </Theme>
      }
      rightNode={
        <View alignItems="flex-end">
          {(txInfo.toAmount || txInfo.toToken) && (
            <Text color="$primary">
              +{ellipsis(toAmountFormatted, 10)} {txInfo.toToken?.symbol ?? ''}
            </Text>
          )}
          <Text fontSize="$3">
            −{ellipsis(fromAmountFormatted, 10)} {txInfo.fromToken.symbol}
          </Text>
        </View>
      }
    />
  )
}
