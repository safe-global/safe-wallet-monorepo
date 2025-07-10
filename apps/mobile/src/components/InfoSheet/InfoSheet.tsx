import React, { useCallback, useRef } from 'react'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { SafeFontIcon } from '../SafeFontIcon'
import { BottomSheetModal, TouchableOpacity } from '@gorhom/bottom-sheet'
import { getVariable, Text, View, useTheme, H4, YStack } from 'tamagui'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge } from '@/src/components/Badge'

export const InfoSheet = ({
  info,
  title,
  displayIcon = true,
  children,
}: {
  info: string
  title?: string
  displayIcon?: boolean
  children?: string | React.ReactElement
}) => {
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
        {!children && <SafeFontIcon name="info" size={16} color="$colorSecondary" />}
        {children}
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        backgroundComponent={BackgroundComponent}
        backdropComponent={() => <BackdropComponent shouldNavigateBack={false} />}
        topInset={insets.top}
        enableDynamicSizing
        handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
          <YStack gap="$4" padding="$4" alignItems="center" justifyContent="center">
            {displayIcon && (
              <Badge
                themeName="badge_background"
                circleSize="$10"
                content={<SafeFontIcon name="info" size={24} color="$color" />}
              />
            )}
            <View gap="$2" alignItems="center">
              {title && <H4 fontWeight="600">{title}</H4>}
              <Text textAlign="center">{info}</Text>
            </View>
          </YStack>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  )
}
