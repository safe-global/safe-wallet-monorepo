import { Pressable } from 'react-native'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface CloseButtonProps {
  onPress: () => void
  testID: string
}

export function CloseButton({ onPress, testID }: CloseButtonProps) {
  return (
    <Pressable onPress={onPress} hitSlop={8} testID={testID}>
      <View
        backgroundColor="$backgroundSkeleton"
        alignItems="center"
        justifyContent="center"
        borderRadius={200}
        height={40}
        width={40}
      >
        <SafeFontIcon name="close" size={24} color="$color" />
      </View>
    </Pressable>
  )
}
