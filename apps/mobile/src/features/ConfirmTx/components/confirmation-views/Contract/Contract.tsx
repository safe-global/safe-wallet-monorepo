import React, { useMemo } from 'react'
import { View, YStack } from 'tamagui'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { formatContractItems } from './utils'
import { CustomTransactionInfo, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { ParametersButton } from '../../ParametersButton'

interface ContractProps {
  txInfo: CustomTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function Contract({ txInfo, executionInfo, txId }: ContractProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const items = useMemo(() => formatContractItems(txInfo, chain), [txInfo, chain])

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

      {txInfo.actionCount && (
        <SafeListItem
          label="Actions"
          rightNode={
            <View flexDirection="row" alignItems="center" gap="$2">
              <Badge themeName="badge_background_inverted" content={txInfo.actionCount.toString()} />

              <SafeFontIcon name={'chevron-right'} />
            </View>
          }
        />
      )}
    </YStack>
  )
}
