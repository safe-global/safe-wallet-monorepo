import { useEffect } from 'react'
import { Linking, Platform } from 'react-native'
import { nativeApplicationVersion } from 'expo-application'
import { H3, Text, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/src/config/constants'
import { trackEvent } from '@/src/services/analytics'
import { APP_UPDATE_EVENTS } from '../constants'

interface ForceUpdateScreenProps {
  minVersion: string
}

const STORE_LABEL = Platform.OS === 'ios' ? 'App Store' : 'Google Play'

export function ForceUpdateScreen({ minVersion }: ForceUpdateScreenProps) {
  const appVersion = nativeApplicationVersion ?? 'unknown'
  const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : GOOGLE_PLAY_URL
  const insets = useSafeAreaInsets()

  useEffect(() => {
    trackEvent({
      eventName: APP_UPDATE_EVENTS.FORCED_UPDATE_SHOWN,
      eventCategory: 'app-update',
      eventAction: 'forced-update-shown',
      eventLabel: `min:${minVersion} app:${appVersion}`,
    })
  }, [minVersion, appVersion])

  const handleUpdate = () => {
    trackEvent({
      eventName: APP_UPDATE_EVENTS.FORCED_UPDATE_TAPPED,
      eventCategory: 'app-update',
      eventAction: 'forced-update-tapped',
      eventLabel: `min:${minVersion} app:${appVersion} platform:${Platform.OS}`,
    })
    Linking.openURL(storeUrl)
  }

  return (
    <YStack
      testID="force-update-screen"
      flex={1}
      backgroundColor="$background"
      paddingHorizontal="$6"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <Badge
          themeName="badge_background"
          circleSize="$12"
          content={<SafeFontIcon name="update" size={32} color="$primary" />}
        />

        <H3 textAlign="center" fontWeight="600">
          Update required
        </H3>

        <Text textAlign="center" color="$colorSecondary" fontSize={16} lineHeight={24} paddingHorizontal="$4">
          A new version of Safe{'{Mobile}'} is available. Please update to continue using the app.
        </Text>
      </YStack>

      <SafeButton testID="force-update-button" onPress={handleUpdate} width="100%" marginBottom="$4">
        {`Update on ${STORE_LABEL}`}
      </SafeButton>
    </YStack>
  )
}
