import React from 'react'
import { YStack, View, Text, H3 } from 'tamagui'
import { CustomTransactionInfo, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { HistoryTransactionHeader } from '../HistoryTransactionHeader'
import { Container } from '@/src/components/Container'
import { Logo } from '@/src/components/Logo'
import { Badge } from '@/src/components/Badge'
import { HashDisplay } from '@/src/components/HashDisplay'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { CircleProps } from 'tamagui'

interface HistoryContractProps {
  txId: string
  txInfo: CustomTransactionInfo
  _executionInfo?: MultisigExecutionDetails
}

const methodBadgeProps: CircleProps = { borderRadius: '$2', paddingHorizontal: '$2', paddingVertical: '$1' }

export function HistoryContract({ txId, txInfo, _executionInfo }: HistoryContractProps) {
  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const methodName = txInfo.methodName ?? 'Contract interaction'

  return (
    <YStack gap="$4">
      <HistoryTransactionHeader
        logo={txInfo.to.logoUri || txInfo.to.value}
        isIdenticon={!txInfo.to.logoUri}
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        transactionType={'Contract interaction'}
      >
        <View alignItems="center">
          <H3 fontWeight={600}>{methodName.charAt(0).toUpperCase() + methodName.slice(1)}</H3>
        </View>
      </HistoryTransactionHeader>

      <Container padding="$4" gap="$4" borderRadius="$3">
        {/* Method Call Badge */}
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Call</Text>
          <Badge
            circleProps={methodBadgeProps}
            themeName="badge_background"
            fontSize={13}
            textContentProps={{ fontFamily: 'DM Mono' }}
            circular={false}
            content={txInfo.methodName ?? ''}
          />
        </View>

        {/* Contract Information */}
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Contract</Text>
          <HashDisplay value={txInfo.to} />
        </View>

        {/* Network Information */}
        {chain && (
          <View alignItems="center" flexDirection="row" justifyContent="space-between">
            <Text color="$textSecondaryLight">Network</Text>
            <View flexDirection="row" alignItems="center" gap="$2">
              <Logo logoUri={chain.chainLogoUri} size="$6" />
              <Text fontSize="$4">{chain.chainName}</Text>
            </View>
          </View>
        )}

        <HistoryAdvancedDetailsButton txId={txId} />
      </Container>
    </YStack>
  )
}
