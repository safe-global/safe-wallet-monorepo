import React from 'react'
import { ListTable } from '../../../ListTable'
import { YStack, XStack } from 'tamagui'
import { TransactionHeader } from '../../../TransactionHeader'
import {
  MultisigExecutionDetails,
  NativeStakingWithdrawTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { ParametersButton } from '../../../ParametersButton'

interface StakingExitProps {
  txInfo: NativeStakingWithdrawTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function StakingExit({ txInfo, executionInfo, txId }: StakingExitProps) {
  const receiveItems = [
    {
      label: 'Receive',
      render: () => (
        <TokenAmount
          value={txInfo.value}
          tokenSymbol={txInfo.tokenInfo.symbol}
          decimals={txInfo.tokenInfo.decimals}
          textProps={{ fontWeight: 600 }}
        />
      ),
    },
  ]

  return (
    <YStack gap="$4">
      <TransactionHeader
        logo={txInfo.tokenInfo.logoUri ?? undefined}
        badgeIcon="transaction-stake"
        badgeColor="$textSecondaryLight"
        title={
          <XStack gap="$1">
            <TokenAmount
              value={txInfo.value}
              tokenSymbol={txInfo.tokenInfo.symbol}
              decimals={txInfo.tokenInfo.decimals}
            />
          </XStack>
        }
        submittedAt={executionInfo.submittedAt}
      />

      <ListTable items={receiveItems}>
        <ParametersButton txId={txId} />
      </ListTable>
    </YStack>
  )
}
