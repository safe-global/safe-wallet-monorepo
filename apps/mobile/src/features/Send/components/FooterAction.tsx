import React from 'react'
import { View, getTokenValue } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { Alert } from '@/src/components/Alert'

interface FooterActionProps {
  exceedsBalance: boolean
  isValid: boolean
  hasActiveSigner: boolean
  isSubmitting: boolean
  keyboardVisible: boolean
  bottomInset: number
  onReview: () => void
}

export function FooterAction({
  exceedsBalance,
  isValid,
  hasActiveSigner,
  isSubmitting,
  keyboardVisible,
  bottomInset,
  onReview,
}: FooterActionProps) {
  const paddingBottom = keyboardVisible ? getTokenValue('$4') : Math.max(bottomInset, getTokenValue('$4'))

  return (
    <View paddingHorizontal="$4" paddingTop="$3" paddingBottom={paddingBottom}>
      {exceedsBalance ? (
        <Alert type="error" message="Insufficient balance" testID="insufficient-balance-alert" />
      ) : (
        <SafeButton
          onPress={onReview}
          disabled={!isValid || !hasActiveSigner || isSubmitting}
          loading={isSubmitting}
          testID="review-button"
        >
          Review & confirm
        </SafeButton>
      )}
    </View>
  )
}
