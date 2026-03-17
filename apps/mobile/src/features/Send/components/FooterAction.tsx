import React from 'react'
import { View, getTokenValue } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { Alert } from '@/src/components/Alert'
import { SelectProposer } from './SelectProposer'
import { Signer } from '@/src/store/signersSlice'
import { Address } from '@/src/types/address'

interface FooterActionProps {
  exceedsBalance: boolean
  isValid: boolean
  activeSigner: Signer | undefined
  availableSigners: Signer[]
  isSubmitting: boolean
  onReview: () => void
  onOpenSignerSheet: () => void
}

export function FooterAction({
  exceedsBalance,
  isValid,
  activeSigner,
  availableSigners,
  isSubmitting,
  onReview,
  onOpenSignerSheet,
}: FooterActionProps) {
  return (
    <View paddingHorizontal="$4" paddingTop="$3" paddingBottom={getTokenValue('$4')} gap="$3">
      {activeSigner && (
        <SelectProposer
          address={activeSigner.value as Address}
          showChevron={availableSigners.length > 1}
          onPress={onOpenSignerSheet}
        />
      )}

      <View minHeight={52} justifyContent="center">
        {exceedsBalance ? (
          <Alert type="error" message="Insufficient balance" testID="insufficient-balance-alert" />
        ) : !activeSigner && availableSigners.length === 0 ? (
          <Alert
            type="warning"
            message="No signer keys found. Import a signer to propose transactions."
            testID="no-signer-alert"
          />
        ) : (
          <SafeButton
            onPress={onReview}
            disabled={!isValid || !activeSigner || isSubmitting}
            loading={isSubmitting}
            testID="review-button"
          >
            Review & confirm
          </SafeButton>
        )}
      </View>
    </View>
  )
}
