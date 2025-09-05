import React, { useMemo } from 'react'
import { YStack, Text, XStack } from 'tamagui'
import {
  DataDecoded,
  MultisigExecutionDetails,
  VaultDepositTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { TokenAmount } from '@/src/components/TokenAmount'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { ParametersButton } from '@/src/components/ParametersButton'
import { vaultTypeToLabel, formatVaultDepositItems } from './utils'
import { Container } from '@/src/components/Container'
import { Image } from 'expo-image'
import { ActionsRow } from '@/src/components/ActionsRow'

const AdditionalRewards = ({ txInfo }: { txInfo: VaultDepositTransactionInfo }) => {
  const reward = txInfo.additionalRewards[0]
  if (!reward) {
    return null
  }

  return (
    <Container padding="$4" gap="$2">
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
          {
            label: 'Fee',
            value: '0%',
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

interface VaultDepositProps {
  txInfo: VaultDepositTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
  decodedData?: DataDecoded | null
}

export function VaultDeposit({ txInfo, executionInfo, txId, decodedData }: VaultDepositProps) {
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

      <ListTable items={[{ label: 'Earn (after fees)', value: formatPercentage(totalNrr) }, ...items]} gap="$4">
        <ParametersButton txId={txId} />
      </ListTable>

      <AdditionalRewards txInfo={txInfo} />

      <Text color="$textSecondaryLight">{txInfo.vaultInfo.description}</Text>

      <ActionsRow txId={txId} decodedData={decodedData} />
    </YStack>
  )
}
