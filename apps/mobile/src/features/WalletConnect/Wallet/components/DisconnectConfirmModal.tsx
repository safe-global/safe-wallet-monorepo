import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { getVariable, H4, Text, useTheme, XStack, YStack } from 'tamagui'
import { FullWindowOverlay } from 'react-native-screens'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { SafeButton } from '@/src/components/SafeButton'

export interface DisconnectConfirmModalProps {
  /** Name of the dApp pending disconnect. `null` keeps the sheet closed. */
  dappName: string | null
  /** Disables the actions while the relay teardown is in flight. */
  isBusy?: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Controlled confirmation sheet for disconnecting a connected dApp. Presenting is driven by
 * `dappName` (non-null opens it); the last name is retained locally so the copy doesn't flash
 * empty during the close animation. Swiping the sheet down routes through `onClose` so the
 * parent's selection state resets in lockstep with the SDK.
 */
export const DisconnectConfirmModal: React.FC<DisconnectConfirmModalProps> = ({
  dappName,
  isBusy = false,
  onConfirm,
  onClose,
}) => {
  const ref = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const [displayName, setDisplayName] = useState<string | null>(dappName)

  useEffect(() => {
    if (dappName) {
      setDisplayName(dappName)
      ref.current?.present()
    } else {
      ref.current?.dismiss()
    }
  }, [dappName])

  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  return (
    <BottomSheetModal
      // @ts-expect-error - FullWindowOverlay is not typed
      containerComponent={Platform.OS === 'ios' ? FullWindowOverlay : undefined}
      ref={ref}
      backgroundComponent={BackgroundComponent}
      backdropComponent={renderBackdrop}
      topInset={insets.top}
      enableDynamicSizing
      handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
      onDismiss={onClose}
      accessible={true}
    >
      <BottomSheetView>
        <YStack gap="$4" padding="$4" paddingBottom={insets.bottom + 16} testID="disconnect-confirm-modal">
          <YStack gap="$2" alignItems="center">
            <H4 fontWeight="600" letterSpacing={-0.2}>
              Disconnect dApp?
            </H4>
            <Text textAlign="center" color="$colorSecondary">
              {`You'll no longer be connected to ${displayName ?? 'this app'}.`}
            </Text>
          </YStack>
          <XStack gap="$3" paddingTop="$2">
            <SafeButton secondary flex={1} onPress={onClose} disabled={isBusy} testID="disconnect-cancel-button">
              Cancel
            </SafeButton>
            <SafeButton
              danger
              flex={1}
              onPress={onConfirm}
              loading={isBusy}
              loadingText="Disconnecting"
              testID="disconnect-confirm-button"
            >
              Disconnect
            </SafeButton>
          </XStack>
        </YStack>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
