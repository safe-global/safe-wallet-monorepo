import React, { useMemo } from 'react'
import { YStack, Text, XStack } from 'tamagui'
import {
  MultisigExecutionDetails,
  VaultRedeemTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { TokenAmount } from '@/src/components/TokenAmount'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { ParametersButton } from '../../ParametersButton'
import { Container } from '@/src/components/Container'
import { vaultTypeToLabel } from '../VaultDeposit/utils'
import { formatVaultRedeemItems } from './utils'
import { Image } from 'expo-image'

const AdditionalRewards = ({ txInfo }: { txInfo: VaultRedeemTransactionInfo }) => {
  const reward = txInfo.additionalRewards[0]
  if (!reward) {
    return null
  }

  const claimable = Number(reward.claimable) > 0
  if (!claimable) {
    return null
  }

  return (
    <Container bordered padding="$4" gap="$2">
      <Text fontWeight="600" marginBottom="$2">
        Additional reward
      </Text>
      <ListTable
        padding="0"
        gap="$4"
        items={[
          {
            label: 'Token',
            value: `${reward.tokenInfo.name} ${reward.tokenInfo.symbol}`,
          },
          {
            label: 'Earn',
            value: formatPercentage(txInfo.additionalRewardsNrr / 100),
          },
        ]}
      />
      <XStack alignItems="center" gap="$1" marginTop="$2">
        <Text fontSize={12} color="$colorSecondary">
          Powered by
        </Text>
        <Image source={{ uri: txInfo.vaultInfo.logoUri }} style={{ width: 16, height: 16 }} />
        <Text fontSize={12} color="$colorSecondary">
          Morpho
        </Text>
      </XStack>
    </Container>
  )
}

interface VaultRedeemProps {
  txInfo: VaultRedeemTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function VaultRedeem({ txInfo, executionInfo, txId }: VaultRedeemProps) {
  const items = useMemo(() => formatVaultRedeemItems(txInfo), [txInfo])

  return (
    <YStack gap="$4">
      <TransactionHeader
        logo={txInfo.tokenInfo.logoUri ?? undefined}
        badgeIcon="transaction-earn"
        badgeColor="$textSecondaryLight"
        title={
          <XStack gap="$1">
            <Text color="$textSecondaryLight" fontSize="$4">
              {vaultTypeToLabel[txInfo.type]}
            </Text>
            <TokenAmount
              value={txInfo.value}
              tokenSymbol={txInfo.tokenInfo.symbol}
              decimals={txInfo.tokenInfo.decimals}
            />
          </XStack>
        }
        submittedAt={executionInfo.submittedAt}
      />

      <ListTable items={items} gap="$4">
        <ParametersButton txId={txId} />
      </ListTable>

      <AdditionalRewards txInfo={txInfo} />

      <Text color="$textSecondaryLight">{txInfo.vaultInfo.description}</Text>
    </YStack>
  )
}
