import React, { useMemo } from 'react'
import { YStack, Text, XStack, View } from 'tamagui'
import { VaultDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { HistoryTransactionHeader } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionHeader'
import { Container } from '@/src/components/Container'
import { TokenAmount } from '@/src/components/TokenAmount'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import {
  vaultTypeToLabel,
  formatVaultDepositItems,
} from '@/src/features/ConfirmTx/components/confirmation-views/VaultDeposit/utils'
import { Image } from 'expo-image'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'

interface HistoryVaultDepositProps {
  txId: string
  txInfo: VaultDepositTransactionInfo
}

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
      <View gap="$3">
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Token</Text>
          <Text fontSize="$4">
            {reward.tokenInfo.name} {reward.tokenInfo.symbol}
          </Text>
        </View>
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Earn</Text>
          <Text fontSize="$4">{formatPercentage(txInfo.additionalRewardsNrr / 100)}</Text>
        </View>
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Fee</Text>
          <Text fontSize="$4">0%</Text>
        </View>
      </View>
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

export function HistoryVaultDeposit({ txId, txInfo }: HistoryVaultDepositProps) {
  const totalNrr = (txInfo.baseNrr + txInfo.additionalRewardsNrr) / 100
  const items = useMemo(() => formatVaultDepositItems(txInfo), [txInfo])

  return (
    <YStack gap="$4">
      <HistoryTransactionHeader
        logo={txInfo.tokenInfo.logoUri ?? undefined}
        badgeIcon="transaction-earn"
        badgeColor="$textSecondaryLight"
        transactionType={vaultTypeToLabel[txInfo.type]}
      >
        <View alignItems="center">
          <TokenAmount
            value={txInfo.value}
            tokenSymbol={txInfo.tokenInfo.symbol}
            decimals={txInfo.tokenInfo.decimals}
            textProps={{ fontSize: '$6', fontWeight: '600' }}
          />
        </View>
      </HistoryTransactionHeader>

      <Container padding="$4" gap="$4" borderRadius="$3">
        {/* Earn Rate */}
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Earn (after fees)</Text>
          <Text fontSize="$4" fontWeight="600">
            {formatPercentage(totalNrr)}
          </Text>
        </View>

        {/* Vault Information */}
        {items.map((item, index) => {
          if ('renderRow' in item) {
            return item.renderRow()
          }
          return (
            <View key={index} alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">{item.label}</Text>
              {item.render ? item.render() : <Text fontSize="$4">{item.value}</Text>}
            </View>
          )
        })}

        <HistoryAdvancedDetailsButton txId={txId} />
      </Container>

      {txInfo.additionalRewards.length > 0 && <AdditionalRewards txInfo={txInfo} />}

      {txInfo.vaultInfo.description && (
        <Container padding="$4" borderRadius="$3">
          <Text color="$textSecondaryLight" fontSize="$3">
            {txInfo.vaultInfo.description}
          </Text>
        </Container>
      )}
    </YStack>
  )
}
