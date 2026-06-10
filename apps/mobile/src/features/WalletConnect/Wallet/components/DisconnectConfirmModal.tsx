import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { getVariable, Text, useTheme, YStack } from 'tamagui'
import { FullWindowOverlay } from 'react-native-screens'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { SafeButton } from '@/src/components/SafeButton'
import { DappIcon } from './DappIcon'

export type DisconnectTarget = { name: string; iconUrl?: string }

export interface DisconnectConfirmModalProps {
  /** The dApp pending disconnect. `null` keeps the sheet closed. */
  dapp: DisconnectTarget | null
  /** Disables the action while the relay teardown is in flight. */
  isBusy?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Confirm sheet for disconnecting a dApp; `dapp` drives presenting and the last target is retained so the icon/name don't flash during the close animation. */
export const DisconnectConfirmModal: React.FC<DisconnectConfirmModalProps> = ({
  dapp,
  isBusy = false,
  onConfirm,
  onClose,
}) => {
  const ref = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const [displayed, setDisplayed] = useState<DisconnectTarget | null>(dapp)

  useEffect(() => {
    if (dapp) {
      setDisplayed(dapp)
      ref.current?.present()
    } else {
      ref.current?.dismiss()
    }
  }, [dapp])

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
        <YStack gap="$5" paddingHorizontal="$4" paddingTop="$2" paddingBottom={insets.bottom + 16}>
          <YStack gap="$5" alignItems="center" testID="disconnect-confirm-modal">
            <Text fontWeight="700" fontSize={16} letterSpacing={-0.1}>
              Disconnect app?
            </Text>
            <YStack gap="$2" alignItems="center">
              <DappIcon url={displayed?.iconUrl} size={36} />
              <Text fontWeight="700" fontSize={16} letterSpacing={0.15}>
                {displayed?.name ?? ''}
              </Text>
            </YStack>
          </YStack>
          <SafeButton
            danger
            width="100%"
            onPress={onConfirm}
            loading={isBusy}
            loadingText="Disconnecting"
            testID="disconnect-confirm-button"
          >
            Disconnect
          </SafeButton>
        </YStack>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
