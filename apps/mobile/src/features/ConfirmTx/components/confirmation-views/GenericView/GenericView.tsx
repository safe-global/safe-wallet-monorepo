import React, { useMemo } from 'react'
import { YStack } from 'tamagui'
import { formatGenericViewItems } from './utils'
import {
  MultisigExecutionDetails,
  TransactionData,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { ListTable } from '../../ListTable'
import { TransactionHeader } from '../../TransactionHeader'
import { ParametersButton } from '@/src/components/ParametersButton'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { ActionsRow } from '@/src/components/ActionsRow'

interface GenericViewProps {
  txInfo: TransactionDetails['txInfo']
  executionInfo: MultisigExecutionDetails
  txData: TransactionData
  txId: string
}

export function GenericView({ txInfo, txData, executionInfo, txId }: GenericViewProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const viewOnExplorer = useOpenExplorer(txData.to.value)
  const items = useMemo(
    () => formatGenericViewItems({ txInfo, txData, chain, executionInfo, viewOnExplorer }),
    [txInfo, executionInfo, txData, chain, viewOnExplorer],
  )

  return (
    <YStack gap="$4">
      <TransactionHeader
        logo={txData.to.logoUri || txData.to.value}
        isIdenticon={!txData.to.logoUri}
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={txData.dataDecoded?.method ?? 'Contract interaction'}
        submittedAt={executionInfo.submittedAt}
      />

      <ListTable items={items}>
        <ParametersButton txId={txId} />
      </ListTable>

      <ActionsRow
        txId={txId}
        actionCount={'actionCount' in txInfo && txInfo.actionCount !== null ? txInfo.actionCount : undefined}
        decodedData={txData.dataDecoded}
      />
    </YStack>
  )
}
