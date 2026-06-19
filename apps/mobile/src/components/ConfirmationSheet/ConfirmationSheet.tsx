import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { Platform } from 'react-native'
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { getVariable, H4, Text, YStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import type { BadgeThemeTypes } from '@/src/components/Badge/Badge'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import type { IconName } from '@/src/types/iconTypes'

interface ConfirmationSheetProps {
  title: string
  message: string
  iconName: IconName
  badgeThemeName: BadgeThemeTypes
  onDismiss: () => void
  testID?: string
  children: (dismiss: () => void) => ReactNode
}

/**
 * Shared scaffolding for the small confirmation/acknowledgement bottom sheets used across the
 * execute flow (e.g. indeterminate simulation, relay unavailable). Owns the modal setup, badge,
 * title and body; callers supply the copy, the badge, and the action buttons.
 */
export function ConfirmationSheet({
  title,
  message,
  iconName,
  badgeThemeName,
  onDismiss,
  testID,
  children,
}: ConfirmationSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  useEffect(() => {
    bottomSheetRef.current?.present()
  }, [])

  const dismiss = useCallback(() => {
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
        <YStack testID={testID} gap="$4" padding="$4" alignItems="center">
          <Badge
            themeName={badgeThemeName}
            circleSize="$12"
            content={<SafeFontIcon name={iconName} size={32} color="$color" />}
          />

          <H4 fontWeight="600">{title}</H4>

          <Text textAlign="center" color="$colorSecondary" fontSize={16} lineHeight={24} paddingHorizontal="$4">
            {message}
          </Text>

          {children(dismiss)}
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
