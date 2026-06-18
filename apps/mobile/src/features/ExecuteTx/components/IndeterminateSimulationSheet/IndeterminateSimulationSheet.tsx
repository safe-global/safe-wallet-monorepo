import { useCallback, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { getVariable, H4, Text, XStack, YStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'

interface IndeterminateSimulationSheetProps {
  /** Re-runs the relay with `acceptUnverifiedSimulation: true`. */
  onConfirm: () => void
  /** Closes the sheet without executing. */
  onDismiss: () => void
}

/**
 * Confirmation sheet shown when CGW's pre-relay simulation is indeterminate (INDETERMINATE_SIMULATION).
 * The transaction couldn't be reviewed, so the user must explicitly opt in to executing anyway.
 */
export function IndeterminateSimulationSheet({ onConfirm, onDismiss }: IndeterminateSimulationSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  useEffect(() => {
    bottomSheetRef.current?.present()
  }, [])

  const handleConfirm = useCallback(() => {
    bottomSheetRef.current?.dismiss()
    onConfirm()
  }, [onConfirm])

  const handleBack = useCallback(() => {
    bottomSheetRef.current?.dismiss()
  }, [])

  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  return (
    <BottomSheetModal
      // @ts-expect-error - FullWindowOverlay is not typed
      containerComponent={Platform.OS === 'ios' ? FullWindowOverlay : undefined}
      ref={bottomSheetRef}
      backgroundComponent={BackgroundComponent}
      backdropComponent={renderBackdrop}
      topInset={insets.top}
      enableDynamicSizing
      handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
      onDismiss={onDismiss}
      accessible={false}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <YStack testID="indeterminate-simulation-sheet" gap="$4" padding="$4" alignItems="center">
          <Badge
            themeName="badge_warning"
            circleSize="$12"
            content={<SafeFontIcon name="alert-triangle" size={32} color="$color" />}
          />

          <H4 fontWeight="600">Confirm execution</H4>

          <Text textAlign="center" color="$colorSecondary" fontSize={16} lineHeight={24} paddingHorizontal="$4">
            We couldn&apos;t review this transaction. If you execute and it fails, you&apos;ll still pay the network
            fee.
          </Text>

          <XStack gap="$3" width="100%">
            <SafeButton flex={1} secondary onPress={handleBack} testID="indeterminate-back-button">
              Back
            </SafeButton>
            <SafeButton flex={1} onPress={handleConfirm} testID="indeterminate-execute-anyway-button">
              Execute anyway
            </SafeButton>
          </XStack>
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
