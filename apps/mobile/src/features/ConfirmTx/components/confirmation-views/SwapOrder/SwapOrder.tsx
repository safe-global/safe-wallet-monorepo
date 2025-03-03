import React, { useMemo } from 'react'
import { SwapOrderHeader } from './SwapOrderHeader'
import { YStack } from 'tamagui'
import { formatSwapOrderItems } from './utils'
import { ListTable } from '../../ListTable'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'

interface SwapOrderProps {
  executionInfo: MultisigExecutionDetails
  txInfo: OrderTransactionInfo
}

export function SwapOrder({ executionInfo, txInfo }: SwapOrderProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state) => selectChainById(state, activeSafe.chainId))

  const items = useMemo(() => formatSwapOrderItems(txInfo, chain), [txInfo, chain])

  return (
    <YStack gap="$4">
      <SwapOrderHeader executionInfo={executionInfo} txInfo={txInfo} />

      <ListTable items={items} />
    </YStack>
  )
}
