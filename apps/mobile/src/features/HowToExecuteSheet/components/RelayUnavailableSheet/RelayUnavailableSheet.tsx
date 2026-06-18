import { useCallback, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { getVariable, H4, Text, YStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'

interface RelayUnavailableSheetProps {
  /** Closes the sheet. Called both on CTA press and on dismiss. */
  onDismiss: () => void
}

/**
 * Terminal sheet shown when a transaction must be relayed (GTF Safe-pays) but the chain does not
 * support relaying. There is no signer fallback, so the only action is to acknowledge and close.
 */
export function RelayUnavailableSheet({ onDismiss }: RelayUnavailableSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  useEffect(() => {
    bottomSheetRef.current?.present()
  }, [])

  const handleClose = useCallback(() => {
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
        <YStack testID="relay-unavailable-sheet" gap="$4" padding="$4" alignItems="center">
          <Badge
            themeName="badge_error"
            circleSize="$12"
            content={<SafeFontIcon name="alert-triangle" size={32} color="$color" />}
          />

          <H4 fontWeight="600">Relay not available</H4>

          <Text textAlign="center" color="$colorSecondary" fontSize={16} lineHeight={24} paddingHorizontal="$4">
            This transaction must be relayed, but relaying is not available on this network.
          </Text>

          <SafeButton width="100%" onPress={handleClose} testID="relay-unavailable-close-button">
            Got it
          </SafeButton>
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
