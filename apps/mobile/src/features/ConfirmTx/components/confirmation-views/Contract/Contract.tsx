import React, { useMemo } from 'react'
import { YStack } from 'tamagui'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { formatContractItems } from './utils'
import { CustomTransactionInfo, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { ParametersButton } from '@/src/components/ParametersButton'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { ActionsRow } from '@/src/components/ActionsRow'

interface ContractProps {
  txInfo: CustomTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function Contract({ txInfo, executionInfo, txId }: ContractProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const viewOnExplorer = useOpenExplorer(txInfo.to.value)

  const items = useMemo(() => formatContractItems(txInfo, chain, viewOnExplorer), [txInfo, chain, viewOnExplorer])

  return (
    <YStack gap="$4">
      <TransactionHeader
        logo={txInfo.to.logoUri || txInfo.to.value}
        isIdenticon={!txInfo.to.logoUri}
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={txInfo.methodName ?? 'Contract interaction'}
        submittedAt={executionInfo.submittedAt}
      />

      <ListTable items={items}>
        <ParametersButton txId={txId} />
      </ListTable>

      <ActionsRow txId={txId} actionCount={txInfo.actionCount} />
    </YStack>
  )
}
