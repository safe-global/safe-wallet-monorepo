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
import { ParametersButton } from '@/src/components/ParametersButton'
import { ActionsRow } from '@/src/components/ActionsRow'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface CancelTxProps {
  txInfo: CustomTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function CancelTx({ txInfo, executionInfo, txId }: CancelTxProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const items = useMemo(() => formatCancelTxItems(chain), [chain])

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

      <ActionsRow txId={txId} actionCount={txInfo.actionCount} />
    </YStack>
  )
}
