import { useCallback, useEffect, useRef } from 'react'
import { Linking, Platform } from 'react-native'
import { nativeApplicationVersion } from 'expo-application'
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { getVariable, H4, Text, YStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/src/config/constants'
import { trackEvent } from '@/src/services/analytics'
import { remoteConfigService } from '@/src/services/remoteConfig/remoteConfigService'
import { APP_UPDATE_EVENTS } from '../constants'

interface SoftUpdatePromptProps {
  onDismiss: () => void
}

const STORE_LABEL = Platform.OS === 'ios' ? 'App Store' : 'Google Play'

export function SoftUpdatePrompt({ onDismiss }: SoftUpdatePromptProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const appVersion = nativeApplicationVersion ?? 'unknown'
  const recommendedVersion = remoteConfigService.getPlatformString('recommended_version')
  const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : GOOGLE_PLAY_URL

  useEffect(() => {
    bottomSheetRef.current?.present()

    trackEvent({
      eventName: APP_UPDATE_EVENTS.SOFT_UPDATE_SHOWN,
      eventCategory: 'app-update',
      eventAction: 'soft-update-shown',
      eventLabel: `recommended:${recommendedVersion} app:${appVersion}`,
    })
  }, [recommendedVersion, appVersion])

  const handleDismiss = useCallback(() => {
    trackEvent({
      eventName: APP_UPDATE_EVENTS.SOFT_UPDATE_DISMISSED,
      eventCategory: 'app-update',
      eventAction: 'soft-update-dismissed',
      eventLabel: `recommended:${recommendedVersion} app:${appVersion}`,
    })
    onDismiss()
  }, [onDismiss, recommendedVersion, appVersion])

  const handleUpdate = useCallback(() => {
    trackEvent({
      eventName: APP_UPDATE_EVENTS.SOFT_UPDATE_TAPPED,
      eventCategory: 'app-update',
      eventAction: 'soft-update-tapped',
      eventLabel: `recommended:${recommendedVersion} app:${appVersion} platform:${Platform.OS}`,
    })
    Linking.openURL(storeUrl)
  }, [recommendedVersion, appVersion, storeUrl])

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
      onDismiss={handleDismiss}
      accessible={false}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <YStack testID="soft-update-prompt" gap="$4" padding="$4" alignItems="center">
          <Badge
            themeName="badge_background"
            circleSize="$12"
            content={<SafeFontIcon name="update" size={32} color="$primary" />}
          />

          <H4 fontWeight="600">Update available</H4>

          <Text textAlign="center" color="$colorSecondary" fontSize={16} lineHeight={24} paddingHorizontal="$4">
            A newer version of Safe{'{Mobile}'} is available. Update for the latest features and improvements.
          </Text>

          <SafeButton testID="soft-update-button" onPress={handleUpdate} width="100%">
            {`Update on ${STORE_LABEL}`}
          </SafeButton>
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
