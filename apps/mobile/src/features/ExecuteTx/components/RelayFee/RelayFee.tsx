import { GradientText } from '@/src/components/GradientText'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

import { Skeleton } from 'moti/skeleton'
import { getTokenValue, Text, View } from 'tamagui'

interface RelayFeeProps {
  isLoadingRelays: boolean
  relaysRemaining?: RelaysRemaining
}

export const RelayFee = ({ isLoadingRelays, relaysRemaining }: RelayFeeProps) => {
  const { colorScheme } = useTheme()

  return (
    <View alignItems="flex-end" flexDirection="row" justifyContent="center" gap="$2">
      <View width="$8">
        <GradientText colors={[getTokenValue('$color.infoMainDark'), getTokenValue('$color.primaryMainDark')]}>
          <Text fontWeight={700}>Free</Text>
        </GradientText>
      </View>

      {isLoadingRelays ? (
        <Skeleton colorMode={colorScheme} height={16} width={80} />
      ) : (
        relaysRemaining && <Text fontWeight={700}>{relaysRemaining.remaining} left / day</Text>
      )}
    </View>
  )
}
