import React from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { Skeleton } from 'moti/skeleton'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { InfoSheet } from '@/src/components/InfoSheet'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { BalanceChangeItem } from './BalanceChangeItem'
import { Container } from '@/src/components/Container'
import { useTheme } from '@/src/theme/hooks/useTheme'

interface BalanceChangeBlockProps {
  threat?: AsyncResult<ThreatAnalysisResults>
}

const BALANCE_CHANGE_INFO =
  'The balance change gives an overview of the implications of a transaction. You can see which assets will be sent and received after the transaction is executed.'

export function BalanceChangeBlock({ threat }: BalanceChangeBlockProps) {
  const { colorScheme } = useTheme()
  const [threatData, threatError, threatLoading = false] = threat || []

  const balanceChanges = threatData?.BALANCE_CHANGE || []
  const totalBalanceChanges = balanceChanges.reduce((prev, current) => prev + current.in.length + current.out.length, 0)

  const renderContent = () => {
    if (threatLoading) {
      return (
        <YStack gap="$2" marginTop="$2">
          <Skeleton colorMode={colorScheme} height={24} radius={4} width="100%" />
        </YStack>
      )
    }

    if (threatError) {
      return (
        <Text fontSize={14} color="$textSecondary" marginTop="$2">
          Could not calculate balance changes.
        </Text>
      )
    }

    if (totalBalanceChanges === 0) {
      return (
        <Text fontSize={14} color="$textSecondary" marginTop="$2">
          No balance change detected
        </Text>
      )
    }

    return (
      <YStack>
        {balanceChanges.map((change, assetIdx) => (
          <React.Fragment key={assetIdx}>
            {change.in.map((diff, changeIdx) => (
              <BalanceChangeItem key={`${assetIdx}-in-${changeIdx}`} asset={change.asset} diff={diff} positive />
            ))}
            {change.out.map((diff, changeIdx) => (
              <BalanceChangeItem key={`${assetIdx}-out-${changeIdx}`} asset={change.asset} diff={diff} />
            ))}
          </React.Fragment>
        ))}
      </YStack>
    )
  }

  return (
    <Container testID="balance-change-block">
      <XStack gap="$2" alignItems="center">
        <InfoSheet title="Balance change" info={BALANCE_CHANGE_INFO}>
          <XStack alignItems="center" gap="$1">
            <Text fontWeight="700">Balance change</Text>
            <SafeFontIcon name="info" size={16} color="$colorSecondary" />
          </XStack>
        </InfoSheet>
      </XStack>

      {renderContent()}
    </Container>
  )
}
