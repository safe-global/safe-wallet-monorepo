import React, { useCallback, useRef } from 'react'
import { BottomSheetScrollView, BottomSheetModal, TouchableOpacity } from '@gorhom/bottom-sheet'
import { getVariable, Text, View, useTheme, H4, YStack, XStack } from 'tamagui'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
import { SafeButton } from '@/src/components/SafeButton'
import { ReadOnlyIconBlock } from '@/src/features/Assets/components/ReadOnly/ReadOnlyIconBlock'

export interface ReadOnlyWarningModalProps {
  onAddSigner: () => void
  children: React.ReactElement
}

export const ReadOnlyWarningModal = ({ onAddSigner, children }: ReadOnlyWarningModalProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  const handleDismiss = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
  }, [])

  const handleAddSigner = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
    onAddSigner()
  }, [onAddSigner])

  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  return (
    <>
      <TouchableOpacity onPress={handlePresentModalPress}>{children}</TouchableOpacity>

      <BottomSheetModal
        // @ts-expect-error - FullWindowOverlay is not typed
        containerComponent={Platform.OS === 'ios' ? FullWindowOverlay : undefined}
        ref={bottomSheetModalRef}
        backgroundComponent={BackgroundComponent}
        backdropComponent={renderBackdrop}
        topInset={insets.top}
        enableDynamicSizing
        handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
          <YStack gap="$4" padding="$4" alignItems="center" justifyContent="center">
            <ReadOnlyIconBlock />
            <View gap="$2" alignItems="center">
              <H4 fontWeight="600" letterSpacing={-0.2}>
                This is a read-only account
              </H4>
              <Text textAlign="center" letterSpacing={0.1}>
                You don't have any signers on this device. Add at least 1 signer of this Safe to approve transactions.
              </Text>
            </View>
            <XStack gap="$3" flex={1} paddingTop="$2">
              <SafeButton secondary onPress={handleDismiss} testID="cancel-button" flex={1}>
                Cancel
              </SafeButton>
              <SafeButton onPress={handleAddSigner} testID="add-signer-button" flex={1}>
                Add signer
              </SafeButton>
            </XStack>
          </YStack>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  )
}
