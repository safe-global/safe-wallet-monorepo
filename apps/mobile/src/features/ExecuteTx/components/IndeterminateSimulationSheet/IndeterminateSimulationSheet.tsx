import { XStack } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { ConfirmationSheet } from '@/src/components/ConfirmationSheet'

interface IndeterminateSimulationSheetProps {
  onConfirm: () => void
  onDismiss: () => void
}

/**
 * Confirmation sheet shown when CGW's pre-relay simulation is indeterminate (INDETERMINATE_SIMULATION).
 * The transaction couldn't be reviewed, so the user must explicitly opt in to executing anyway.
 */
export function IndeterminateSimulationSheet({ onConfirm, onDismiss }: IndeterminateSimulationSheetProps) {
  return (
    <ConfirmationSheet
      testID="indeterminate-simulation-sheet"
      iconName="alert-triangle"
      badgeThemeName="badge_warning"
      title="Confirm execution"
      message="We couldn't review this transaction. If you execute and it fails, you'll still pay the network fee."
      onDismiss={onDismiss}
    >
      {(dismiss) => (
        <XStack gap="$3" width="100%">
          <SafeButton flex={1} secondary onPress={dismiss} testID="indeterminate-back-button">
            Back
          </SafeButton>
          <SafeButton
            flex={1}
            onPress={() => {
              dismiss()
              onConfirm()
            }}
            testID="indeterminate-execute-anyway-button"
          >
            Execute anyway
          </SafeButton>
        </XStack>
      )}
    </ConfirmationSheet>
  )
}
