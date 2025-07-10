import React, { useMemo } from 'react'
import { ListTable } from '../../../ListTable'
import { formatStakingWithdrawRequestItems } from '../utils'
import { YStack, Text, XStack } from 'tamagui'
import { TransactionHeader } from '../../../TransactionHeader'
import {
  MultisigExecutionDetails,
  NativeStakingValidatorsExitTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmount } from '@/src/components/TokenAmount'
import { ParametersButton } from '../../../ParametersButton'
import { Alert2 } from '@/src/components/Alert2'

interface StakingWithdrawRequestProps {
  txInfo: NativeStakingValidatorsExitTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function StakingWithdrawRequest({ txInfo, executionInfo, txId }: StakingWithdrawRequestProps) {
  const withdrawRequestItems = useMemo(() => formatStakingWithdrawRequestItems(txInfo), [txInfo])

  return (
    <YStack gap="$4">
      <TransactionHeader
        logo={txInfo.tokenInfo.logoUri ?? undefined}
        badgeIcon="transaction-stake"
        badgeColor="$textSecondaryLight"
        title={
          <XStack gap="$1">
            <Text>Receive</Text>
            <TokenAmount
              value={txInfo.value}
              tokenSymbol={txInfo.tokenInfo.symbol}
              decimals={txInfo.tokenInfo.decimals}
            />
          </XStack>
        }
        submittedAt={executionInfo.submittedAt}
      />

      <ListTable items={withdrawRequestItems}>
        <ParametersButton txId={txId} />
        <Text fontSize="$3" color="$textSecondaryLight">
          The selected amount and any rewards will be withdrawn from Dedicated Staking for ETH after the validator exit.
        </Text>
      </ListTable>

      <YStack gap="$3">
        <Alert2
          type="warning"
          message="This transaction is a withdrawal request. After it's executed, you'll need to complete a separate withdrawal transaction."
        />
      </YStack>
    </YStack>
  )
}
