import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export const ReadOnlyIconBlock = () => {
  return (
    <View
      backgroundColor="$colorLight"
      borderRadius="$4"
      height="32"
      width="32"
      justifyContent="center"
      alignItems="center"
    >
      <SafeFontIcon name="eye-n" color="$colorContrast" size={24} />
    </View>
  )
}
