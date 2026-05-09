import React from 'react'
import { getTokenValue, View, YStack } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RiskAcknowledgmentCheckbox } from '@/src/components/RiskAcknowledgmentCheckbox/RiskAcknowledgmentCheckbox'

export interface SignFormProps {
  txId: string
  showRiskCheckbox: boolean
  riskAcknowledged: boolean
  onRiskAcknowledgedChange: (acknowledged: boolean) => void
}

export function SignForm({ txId, riskAcknowledged, onRiskAcknowledgedChange, showRiskCheckbox }: SignFormProps) {
  const { bottom } = useSafeAreaInsets()

  const onSignPress = () => {
    router.push({
      pathname: '/review-and-confirm',
      params: { txId },
    })
  }

  return (
    <View gap="$4" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <View paddingHorizontal={'$4'} gap="$2" flexDirection="row">
        <YStack justifyContent="center" gap="$2" width="100%">
          {showRiskCheckbox && (
            <RiskAcknowledgmentCheckbox
              checked={riskAcknowledged}
              onToggle={onRiskAcknowledgedChange}
              label="I understand the risks and would like to proceed with transaction."
            />
          )}
          <SafeButton onPress={onSignPress} disabled={showRiskCheckbox && !riskAcknowledged}>
            Continue
          </SafeButton>
        </YStack>
      </View>
    </View>
  )
}
