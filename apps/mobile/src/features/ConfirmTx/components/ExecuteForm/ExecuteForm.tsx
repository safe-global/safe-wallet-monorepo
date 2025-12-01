import { SafeButton } from '@/src/components/SafeButton'
import React from 'react'
import { View, Text, YStack, getTokenValue } from 'tamagui'
import { router } from 'expo-router'
import useIsNextTx from '@/src/hooks/useIsNextTx'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RiskAcknowledgmentCheckbox } from '@/src/components/RiskAcknowledgmentCheckbox/RiskAcknowledgmentCheckbox'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

interface ExecuteFormProps {
  txId: string
  highlightedSeverity?: Severity
  riskAcknowledged: boolean
  onRiskAcknowledgedChange: (acknowledged: boolean) => void
  showRiskCheckbox: boolean
}

export function ExecuteForm({ txId, riskAcknowledged, onRiskAcknowledgedChange, showRiskCheckbox }: ExecuteFormProps) {
  const { bottom } = useSafeAreaInsets()
  const isNext = useIsNextTx(txId)

  const onExecutePress = () => {
    router.push({
      pathname: '/review-and-execute',
      params: { txId },
    })
  }

  return (
    <View gap="$4" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <View paddingHorizontal={'$3'} gap="$2" flexDirection="row">
        <YStack justifyContent="center" gap="$2" width="100%">
          {!isNext && (
            <Text
              fontSize="$4"
              fontWeight={400}
              width="70%"
              alignSelf="center"
              textAlign="center"
              color="$textSecondaryLight"
            >
              You must execute the transaction with the lowest nonce first.
            </Text>
          )}
          {showRiskCheckbox && (
            <RiskAcknowledgmentCheckbox
              checked={riskAcknowledged}
              onToggle={onRiskAcknowledgedChange}
              label="I understand the risks and would like to proceed with transaction."
            />
          )}
          <SafeButton onPress={onExecutePress} disabled={!isNext || (showRiskCheckbox && !riskAcknowledged)}>
            Continue
          </SafeButton>
        </YStack>
      </View>
    </View>
  )
}
