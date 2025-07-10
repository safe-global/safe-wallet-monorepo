import React, { useMemo } from 'react'
import { View, YStack, Text } from 'tamagui'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { formatCancelTxItems } from './utils'
import { CustomTransactionInfo, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { ParametersButton } from '../../ParametersButton'
import { router } from 'expo-router'

interface CancelTxProps {
  txInfo: CustomTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function CancelTx({ txInfo, executionInfo, txId }: CancelTxProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const items = useMemo(() => formatCancelTxItems(chain), [chain])

  const handleViewActions = () => {
    router.push({
      pathname: '/transaction-actions',
      params: { txId },
    })
  }

  return (
    <YStack gap="$4">
      <TransactionHeader
        customLogo={
          <View borderRadius={100} padding="$2" backgroundColor="$errorDark">
            <SafeFontIcon color="$error" name="close-outlined" />
          </View>
        }
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={txInfo.methodName ?? 'On-chain rejection'}
        submittedAt={executionInfo.submittedAt}
      />

      <Text fontSize="$4">
        This is an on-chain rejection that didn’t send any funds. This on-chain rejection replaced all transactions with
        nonce {executionInfo.nonce}.
      </Text>

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
          onPress={handleViewActions}
        />
      )}
    </YStack>
  )
}
