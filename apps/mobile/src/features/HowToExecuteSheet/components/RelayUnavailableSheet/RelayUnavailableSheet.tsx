import { SafeButton } from '@/src/components/SafeButton'
import { ConfirmationSheet } from '@/src/components/ConfirmationSheet'

interface RelayUnavailableSheetProps {
  onDismiss: () => void
}

/**
 * Terminal sheet shown when a transaction must be relayed (GTF Safe-pays) but the chain does not
 * support relaying. There is no signer fallback, so the only action is to acknowledge and close.
 */
export function RelayUnavailableSheet({ onDismiss }: RelayUnavailableSheetProps) {
  return (
    <ConfirmationSheet
      testID="relay-unavailable-sheet"
      iconName="alert-triangle"
      badgeThemeName="badge_error"
      title="Relay not available"
      message="This transaction must be relayed, but relaying is not available on this network."
      onDismiss={onDismiss}
    >
      {(dismiss) => (
        <SafeButton width="100%" onPress={dismiss} testID="relay-unavailable-close-button">
          Got it
        </SafeButton>
      )}
    </ConfirmationSheet>
  )
}
