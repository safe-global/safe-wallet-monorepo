import React from 'react'
import { Pressable } from 'react-native'
import { router, type RelativePathString } from 'expo-router'
import { Text, View } from 'tamagui'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/src/store/hooks'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { selectSessionCount } from '../store/walletKitSlice'
import { SafeListItem } from '@/src/components/SafeListItem/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

/**
 * Settings row linking to the connected-dApps screen. Hidden entirely unless the
 * NATIVE_WALLETCONNECT feature is on and there is at least one live session, so it never
 * shows a dead "0 apps" entry.
 */
export const ConnectedDappsEntry: React.FC = () => {
  const isEnabled = useHasFeature(FEATURES.NATIVE_WALLETCONNECT) ?? false
  const count = useAppSelector(selectSessionCount)
  if (!isEnabled || count === 0) {
    return null
  }
  return (
    <Pressable
      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}
      onPress={() => router.push('/connected-apps' as RelativePathString)}
      testID="settings-connected-apps-entry"
    >
      <SafeListItem
        label="Connected apps"
        testID="settings-connected-apps-list-item"
        leftNode={<SafeFontIcon name="link" color="$colorSecondary" />}
        rightNode={
          <View flexDirection="row" alignItems="center" gap="$2">
            <Text color="$colorSecondary" testID="connected-apps-count">
              {count}
            </Text>
            <SafeFontIcon name="chevron-right" />
          </View>
        }
      />
    </Pressable>
  )
}
