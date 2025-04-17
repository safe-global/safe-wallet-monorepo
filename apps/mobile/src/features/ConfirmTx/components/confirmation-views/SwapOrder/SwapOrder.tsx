import React, { useMemo } from 'react'
import { SwapOrderHeader } from './SwapOrderHeader'
import { YStack } from 'tamagui'
import { formatSwapOrderItems, formatTwapOrderItems } from './utils'
import { ListTable } from '../../ListTable'
import { DataDecoded, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { isTwapOrderTxInfo } from '@/src/utils/transaction-guards'
import { isSettingTwapFallbackHandler } from '@safe-global/utils/features/swap/helpers/utils'
import { TwapFallbackHandlerWarning } from '@/src/features/ConfirmTx/components/confirmation-views/SwapOrder/TwapFallbackHandlerWarning'

interface SwapOrderProps {
  executionInfo: MultisigExecutionDetails
  txInfo: OrderTransactionInfo
  decodedData?: DataDecoded | null
}

export function SwapOrder({ executionInfo, txInfo, decodedData }: SwapOrderProps) {
  const order = txInfo

  const isTwapOrder = isTwapOrderTxInfo(order)

  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state) => selectChainById(state, activeSafe.chainId))

  const swapItems = useMemo(() => formatSwapOrderItems(txInfo, chain), [txInfo, chain])

  const twapItems = useMemo(() => {
    return isTwapOrder ? formatTwapOrderItems(order) : []
  }, [order, chain])

  const isChangingFallbackHandler = decodedData && isSettingTwapFallbackHandler(decodedData)

  return (
    <YStack gap="$4">
      {isChangingFallbackHandler && <TwapFallbackHandlerWarning />}
      <SwapOrderHeader executionInfo={executionInfo} txInfo={txInfo} />

      <ListTable items={swapItems} />
      {isTwapOrder && <ListTable items={twapItems} />}
    </YStack>
  )
}
