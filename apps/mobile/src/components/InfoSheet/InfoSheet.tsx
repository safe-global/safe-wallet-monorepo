import React, { useCallback, useRef } from 'react'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import { SafeFontIcon } from '../SafeFontIcon'
import { BottomSheetModal, TouchableOpacity } from '@gorhom/bottom-sheet'
import { getVariable, Text, View, useTheme } from 'tamagui'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const InfoSheet = ({ info }: { info: string }) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  return (
    <>
      <TouchableOpacity onPress={handlePresentModalPress}>
        <SafeFontIcon name="info" size={16} color="$colorSecondary" />
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        backgroundComponent={BackgroundComponent}
        backdropComponent={() => <BackdropComponent shouldNavigateBack={false} />}
        topInset={insets.top}
        bottomInset={insets.bottom}
        enableDynamicSizing
        handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
      >
        <BottomSheetView>
          <View alignItems="center" padding="$4">
            <Text>{info}</Text>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
}
