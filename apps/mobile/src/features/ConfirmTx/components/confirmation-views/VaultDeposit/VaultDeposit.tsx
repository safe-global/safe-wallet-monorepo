import React, { useMemo } from 'react'
import { YStack, Text, XStack } from 'tamagui'
import {
  MultisigExecutionDetails,
  VaultDepositTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { TokenAmount } from '@/src/components/TokenAmount'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { ParametersButton } from '../../ParametersButton'
import { vaultTypeToLabel, formatVaultDepositItems } from './utils'
import { Container } from '@/src/components/Container'

const AdditionalRewards = ({ txInfo }: { txInfo: VaultDepositTransactionInfo }) => {
  const reward = txInfo.additionalRewards[0]
  if (!reward) {
    return null
  }

  return (
    <Container padding="$4" gap="$2">
      <Text fontWeight="600">Additional reward</Text>
      <ListTable
        items={[
          {
            label: 'Token',
            value: `${reward.tokenInfo.name} ${reward.tokenInfo.symbol}`,
          },
          {
            label: 'Reward rate',
            value: formatPercentage(txInfo.additionalRewardsNrr / 100),
          },
          {
            label: 'Fee',
            value: '0%',
          },
        ]}
      />
      <XStack alignItems="center" gap="$1">
        <Text fontSize={12} color="$colorSecondary">
          Powered by
        </Text>
        <Text fontSize={12} color="$colorSecondary">
          Morpho
        </Text>
      </XStack>
    </Container>
  )
}

interface VaultDepositProps {
  txInfo: VaultDepositTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function VaultDeposit({ txInfo, executionInfo, txId }: VaultDepositProps) {
  const totalNrr = (txInfo.baseNrr + txInfo.additionalRewardsNrr) / 100
  const items = useMemo(() => formatVaultDepositItems(txInfo), [txInfo])

  return (
    <YStack gap="$4">
      <TransactionHeader
        logo={txInfo.tokenInfo.logoUri ?? undefined}
        badgeIcon="transaction-earn"
        badgeColor="$textSecondaryLight"
        title={
          <XStack gap="$1">
            <Text fontSize="$4">{vaultTypeToLabel[txInfo.type]}</Text>
            <TokenAmount
              value={txInfo.value}
              tokenSymbol={txInfo.tokenInfo.symbol}
              decimals={txInfo.tokenInfo.decimals}
            />
          </XStack>
        }
        submittedAt={executionInfo.submittedAt}
      />

      <ListTable items={[{ label: 'Earn (after fees)', value: formatPercentage(totalNrr) }, ...items]}>
        <ParametersButton txId={txId} />
      </ListTable>

      <AdditionalRewards txInfo={txInfo} />

      <Text color="$textSecondaryLight">{txInfo.vaultInfo.description}</Text>
    </YStack>
  )
}
