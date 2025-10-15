import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { IconName } from '@/src/types/iconTypes'
import { Text, View } from 'tamagui'

interface CanNotEstimateProps {
  iconName?: IconName
}

export const CanNotEstimate = ({ iconName = 'alert-triangle' }: CanNotEstimateProps) => {
  return (
    <View alignItems="center" flexDirection="row" gap="$1" justifyContent="center">
      <SafeFontIcon name={iconName} color="$error" size={16} />
      <Text fontWeight={600}>Can not estimate.</Text>
    </View>
  )
}
