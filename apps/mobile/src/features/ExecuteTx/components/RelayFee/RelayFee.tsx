import { GradientText } from '@/src/components/GradientText'
import { SafeSkeleton } from '@/src/components/SafeSkeleton'
import { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

import { getTokenValue, Text, View } from 'tamagui'
import { CanNotEstimate } from '../CanNotEstimate'
import { TouchableOpacity } from 'react-native'

interface RelayFeeProps {
  isLoadingRelays: boolean
  relaysRemaining?: RelaysRemaining
  willFail?: boolean
  onFailTextPress?: () => void
}

export const RelayFee = ({ isLoadingRelays, willFail, relaysRemaining, onFailTextPress }: RelayFeeProps) => {
  return (
    <View alignItems="flex-end" flexDirection="row" justifyContent="center" gap="$2">
      {willFail ? (
        <TouchableOpacity onPress={onFailTextPress}>
          <CanNotEstimate />
        </TouchableOpacity>
      ) : (
        <>
          <View width="$8">
            <GradientText colors={[getTokenValue('$color.infoMainDark'), getTokenValue('$color.primaryMainDark')]}>
              <Text fontWeight={700}>Free</Text>
            </GradientText>
          </View>

          {isLoadingRelays ? (
            <SafeSkeleton height={16} width={80} />
          ) : (
            relaysRemaining && <Text fontWeight={700}>{relaysRemaining.remaining} left / day</Text>
          )}
        </>
      )}
    </View>
  )
}
