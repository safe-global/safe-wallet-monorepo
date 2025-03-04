import React, { useMemo } from 'react'
import { View, YStack } from 'tamagui'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { formatGenericViewItems } from './utils'
import {
  SettingsChangeTransaction,
  MultisigExecutionDetails,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'

interface GenericViewProps {
  txInfo: SettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
  txData: TransactionData
}

export function GenericView({ txInfo, txData, executionInfo }: GenericViewProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const items = useMemo(
    () => formatGenericViewItems({ txInfo, txData, chain, executionInfo }),
    [txInfo, executionInfo, txData, chain],
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

      <ListTable items={items} />

      {'actionCount' in txInfo && (
        <SafeListItem
          label="Actions"
          rightNode={
            <View flexDirection="row" alignItems="center" gap="$2">
              <Badge themeName="badge_background_inverted" content={txInfo.actionCount as string} />

              <SafeFontIcon name={'chevron-right'} />
            </View>
          }
        />
      )}
    </YStack>
  )
}
