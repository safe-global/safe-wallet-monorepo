import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Text, View } from 'tamagui'

export const CanNotEstimate = () => {
  return (
    <View alignItems="center" flexDirection="row" gap="$1" justifyContent="center">
      <SafeFontIcon name="alert-triangle" color="$error" size={20} />
      <Text fontWeight={600}>Can not estimate.</Text>
    </View>
  )
}
