import React, { useMemo } from 'react'
import { YStack, Text } from 'tamagui'
import { ListTable } from '../../ListTable'
import { MultisigExecutionDetails, SwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatUnits } from 'ethers'
import { EthAddress } from '@/src/components/EthAddress'
import { type ListTableItem } from '../../ListTable'
import { LifiSwapHeader } from './LifiSwapHeader'
import { ParametersButton } from '../../ParametersButton'

interface LifiSwapTransactionProps {
  txId: string
  executionInfo: MultisigExecutionDetails
  txInfo: SwapTransactionInfo
}

export function LifiSwapTransaction({ txId, executionInfo, txInfo }: LifiSwapTransactionProps) {
  const lifiSwapItems = useMemo(() => {
    const items: ListTableItem[] = []

    // Exchange rate
    const fromAmountDecimals = formatUnits(txInfo.fromAmount, txInfo.fromToken.decimals)
    const toAmountDecimals = formatUnits(txInfo.toAmount, txInfo.toToken.decimals)
    const exchangeRate = Number(toAmountDecimals) / Number(fromAmountDecimals)

    items.push({
      label: 'Price',
      render: () => (
        <Text>
          1 {txInfo.fromToken.symbol} = {exchangeRate.toFixed(6)} {txInfo.toToken.symbol}
        </Text>
      ),
    })

    // Receiver
    items.push({
      label: 'Receiver',
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
  }, [txInfo])

  return (
    <YStack gap="$4">
      <LifiSwapHeader txInfo={txInfo} executionInfo={executionInfo} />
      <ListTable items={lifiSwapItems}>
        <ParametersButton txId={txId} />
      </ListTable>
    </YStack>
  )
}
