import React, { useMemo } from 'react'
import { SwapOrderHeader } from './SwapOrderHeader'
import { View, YStack } from 'tamagui'
import { formatSwapOrderItems, formatTwapOrderItems } from './utils'
import { ListTable } from '../../ListTable'
import { DataDecoded, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { isMultiSendData, isTwapOrderTxInfo } from '@/src/utils/transaction-guards'
import { isSettingTwapFallbackHandler } from '@safe-global/utils/features/swap/helpers/utils'
import { TwapFallbackHandlerWarning } from '@/src/features/ConfirmTx/components/confirmation-views/SwapOrder/TwapFallbackHandlerWarning'
import { Alert2 } from '@/src/components/Alert2'
import { useRecipientItem } from './hooks'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { SafeListItem } from '@/src/components/SafeListItem'
import { useRouter } from 'expo-router'

interface SwapOrderProps {
  executionInfo: MultisigExecutionDetails
  txInfo: OrderTransactionInfo
  decodedData?: DataDecoded | null
  txId: string
}

export function SwapOrder({ executionInfo, txInfo, decodedData, txId }: SwapOrderProps) {
  const order = txInfo
  const router = useRouter()
  const isTwapOrder = isTwapOrderTxInfo(order)

  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state) => selectChainById(state, activeSafe.chainId))

  const swapItems = useMemo(() => formatSwapOrderItems(txInfo, chain), [txInfo, chain])

  const twapItems = useMemo(() => {
    return isTwapOrder ? formatTwapOrderItems(order) : []
  }, [order, chain])

  const isChangingFallbackHandler = decodedData && isSettingTwapFallbackHandler(decodedData)

  const recipientItems = useRecipientItem(order)

  const showRecipientWarning = order.receiver && order.owner !== order.receiver

  const handleViewActions = () => {
    router.push({
      pathname: '/transaction-actions',
      params: { txId },
    })
  }

  return (
    <YStack gap="$4">
      {isChangingFallbackHandler && <TwapFallbackHandlerWarning />}
      <SwapOrderHeader executionInfo={executionInfo} txInfo={txInfo} />

      <ListTable items={swapItems} />
      {recipientItems.length > 0 && <ListTable items={recipientItems} />}
      {isTwapOrder && <ListTable items={twapItems} />}

      {showRecipientWarning && (
        <Alert2
          type="warning"
          title="Order recipient address differs from order owner."
          message="Double check the address to prevent fund loss."
          testID="recipient-warning-alert"
        />
      )}

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
