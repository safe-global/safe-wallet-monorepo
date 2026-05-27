import React from 'react'
import { Pressable } from 'react-native'
import { router, RelativePathString } from 'expo-router'
import { View } from 'tamagui'
import { useAppSelector } from '@/src/store/hooks'
import { selectSessionCount } from '../store/walletKitSlice'
import { SafeListItem } from '@/src/components/SafeListItem/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export const ConnectedDappsEntry: React.FC = () => {
  const count = useAppSelector(selectSessionCount)
  if (count === 0) {
    return null
  }
  return (
    <Pressable
      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}
      onPress={() => {
        router.push('/connected-apps' as RelativePathString)
      }}
    >
      <SafeListItem
        label="Connected apps"
        testID="settings-connected-apps-list-item"
        leftNode={<SafeFontIcon name="apps" color="$colorSecondary" />}
        rightNode={
          <View flexDirection={'row'} alignItems={'center'} justifyContent={'center'}>
            <SafeFontIcon name="chevron-right" />
          </View>
        }
      />
    </Pressable>
  )
}
