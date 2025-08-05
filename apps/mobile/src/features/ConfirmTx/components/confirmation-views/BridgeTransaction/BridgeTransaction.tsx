import React, { useMemo } from 'react'
import { YStack, Text, View } from 'tamagui'
import { ListTable } from '../../ListTable'
import { BridgeAndSwapTransactionInfo, DataDecoded } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { TokenAmount } from '@/src/components/TokenAmount'
import { formatUnits } from 'ethers'
import { EthAddress } from '@/src/components/EthAddress'
import { type ListTableItem } from '../../ListTable'
import { BridgeRecipientWarnings } from './BridgeRecipientWarnings'
import { ChainIndicator } from '@/src/components/ChainIndicator'
import { ParametersButton } from '../../ParametersButton'
import { useRouter } from 'expo-router'
import { isMultiSendData } from '@/src/utils/transaction-guards'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'

interface BridgeTransactionProps {
  txId: string
  txInfo: BridgeAndSwapTransactionInfo
  decodedData?: DataDecoded | null
}

export function BridgeTransaction({ txId, txInfo, decodedData }: BridgeTransactionProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state) => selectChainById(state, activeSafe.chainId))
  const router = useRouter()

  const bridgeItems = useMemo(() => {
    const items: ListTableItem[] = []

    // Amount section
    const actualFromAmount =
      BigInt(txInfo.fromAmount) + BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n)

    if (txInfo.status === 'PENDING' || txInfo.status === 'AWAITING_EXECUTION') {
      items.push({
        label: 'Amount',
        render: () => (
          <View flexDirection="row" alignItems="center" gap="$2" flexWrap="wrap" justifyContent="center">
            <Text>Sending</Text>
            <TokenAmount
              value={actualFromAmount.toString()}
              decimals={txInfo.fromToken.decimals}
              tokenSymbol={txInfo.fromToken.symbol}
            />
            <Text>to</Text>
            <ChainIndicator chainId={txInfo.toChain} onlyLogo />
          </View>
        ),
      })
    } else if (txInfo.status === 'FAILED') {
      items.push({
        label: 'Amount',
        render: () => (
          <View flexDirection="row" alignItems="center" gap="$2" flexWrap="wrap">
            <Text>Failed to send</Text>
            <TokenAmount
              value={actualFromAmount.toString()}
              decimals={txInfo.fromToken.decimals}
              tokenSymbol={txInfo.fromToken.symbol}
            />
            <Text>to {txInfo.toChain}</Text>
          </View>
        ),
      })

      if (txInfo.substatus) {
        items.push({
          label: 'Substatus',
          render: () => <Text>{txInfo.substatus}</Text>,
        })
      }
    } else if (txInfo.status === 'DONE') {
      const fromAmountDecimals = formatUnits(actualFromAmount, txInfo.fromToken.decimals)
      const toAmountDecimals =
        txInfo.toAmount && txInfo.toToken ? formatUnits(txInfo.toAmount, txInfo.toToken.decimals) : undefined
      const exchangeRate = toAmountDecimals ? Number(toAmountDecimals) / Number(fromAmountDecimals) : undefined

      items.push({
        label: 'Amount',
        render: () => (
          <YStack gap="$2">
            <View flexDirection="row" alignItems="center" gap="$2" flexWrap="wrap">
              <Text>Sell</Text>
              <TokenAmount
                value={actualFromAmount.toString()}
                decimals={txInfo.fromToken.decimals}
                tokenSymbol={txInfo.fromToken.symbol}
              />
              <Text>on {chain?.chainName ?? 'Unknown Chain'}</Text>
            </View>
            {txInfo.toToken && txInfo.toAmount ? (
              <View flexDirection="row" alignItems="center" gap="$2" flexWrap="wrap">
                <Text>For</Text>
                <TokenAmount
                  value={txInfo.toAmount}
                  decimals={txInfo.toToken.decimals}
                  tokenSymbol={txInfo.toToken.symbol}
                />
                <Text>on {txInfo.toChain}</Text>
              </View>
            ) : (
              <Text>Could not find buy token information.</Text>
            )}
          </YStack>
        ),
      })

      if (exchangeRate && txInfo.toToken) {
        items.push({
          label: 'Exchange Rate',
          render: () => (
            <Text>
              1 {txInfo.fromToken.symbol} = {formatAmount(exchangeRate)} {txInfo.toToken?.symbol}
            </Text>
          ),
        })
      }
    }

    // Recipient
    items.push({
      label: 'Recipient',
      render: () => (
        <EthAddress
          address={txInfo.recipient.value as `0x${string}`}
          copy
          copyProps={{ color: '$textSecondaryLight' }}
        />
      ),
    })

    // Fees
    const totalFee = formatUnits(
      BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n),
      txInfo.fromToken.decimals,
    )

    items.push({
      label: 'Fees',
      render: () => (
        <Text>
          {Number(totalFee).toFixed(6)} {txInfo.fromToken.symbol}
        </Text>
      ),
    })

    return items
  }, [txInfo, chain])

  const handleViewActions = () => {
    router.push({
      pathname: '/transaction-actions',
      params: { txId },
    })
  }

  return (
    <YStack gap="$4">
      <ListTable items={bridgeItems}>
        <ParametersButton txId={txId} />
      </ListTable>

      <BridgeRecipientWarnings txInfo={txInfo} />

      {decodedData && isMultiSendData(decodedData) && (
        <SafeListItem
          label="Actions"
          rightNode={
            <View flexDirection="row" alignItems="center" gap="$2">
              {decodedData.parameters?.[0]?.valueDecoded && (
                <Badge
                  themeName="badge_background_inverted"
                  content={
                    Array.isArray(decodedData.parameters[0].valueDecoded)
                      ? decodedData.parameters[0].valueDecoded.length.toString()
                      : '1'
                  }
                />
              )}

              <SafeFontIcon name={'chevron-right'} />
            </View>
          }
          onPress={handleViewActions}
        />
      )}
    </YStack>
  )
}
