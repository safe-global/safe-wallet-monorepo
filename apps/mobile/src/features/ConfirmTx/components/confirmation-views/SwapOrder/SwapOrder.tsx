import React, { useMemo } from 'react'
import { SwapOrderHeader } from './SwapOrderHeader'
import { YStack } from 'tamagui'
import { formatSwapOrderItemsForConfirmation, formatTwapOrderItemsForConfirmation } from '@/src/utils/swapOrderUtils'
import { ListTable } from '../../ListTable'
import { DataDecoded, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { isTwapOrderTxInfo } from '@/src/utils/transaction-guards'
import { isSettingTwapFallbackHandler } from '@safe-global/utils/features/swap/helpers/utils'
import { TwapFallbackHandlerWarning } from '@/src/features/ConfirmTx/components/confirmation-views/SwapOrder/TwapFallbackHandlerWarning'
import { Alert } from '@/src/components/Alert'
import { useRecipientItem } from './hooks'
import { ParametersButton } from '@/src/components/ParametersButton'
import { ActionsRow } from '@/src/components/ActionsRow'

interface SwapOrderProps {
  executionInfo: MultisigExecutionDetails
  txInfo: OrderTransactionInfo
  decodedData?: DataDecoded | null
  txId: string
}

export function SwapOrder({ executionInfo, txInfo, decodedData, txId }: SwapOrderProps) {
  const order = txInfo
  const isTwapOrder = isTwapOrderTxInfo(order)

  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state) => selectChainById(state, activeSafe.chainId))

  const swapItems = useMemo(() => formatSwapOrderItemsForConfirmation(txInfo, chain), [txInfo, chain])

  const twapItems = useMemo(() => {
    return isTwapOrder ? formatTwapOrderItemsForConfirmation(order) : []
  }, [order, chain])

  const isChangingFallbackHandler = decodedData && isSettingTwapFallbackHandler(decodedData)

  const recipientItems = useRecipientItem(order)

  const showRecipientWarning = order.receiver && order.owner !== order.receiver

  return (
    <YStack gap="$4">
      {isChangingFallbackHandler && <TwapFallbackHandlerWarning />}
      <SwapOrderHeader executionInfo={executionInfo} txInfo={txInfo} />

      <ListTable items={swapItems}>
        <ParametersButton txId={txId} />
      </ListTable>
      {recipientItems.length > 0 && <ListTable items={recipientItems} />}
      {isTwapOrder && <ListTable items={twapItems} />}

      {showRecipientWarning && (
        <Alert
          type="warning"
          message="Order recipient address differs from order owner."
          info="Double check the address to prevent fund loss."
          testID="recipient-warning-alert"
        />
      )}

      <ActionsRow txId={txId} decodedData={decodedData} />
    </YStack>
  )
}
