import { View, Text, H4, getTokenValue } from 'tamagui'
import { LedgerIcon } from '@/src/features/Ledger/icons'
import { Loader } from '@/src/components/Loader'

interface LedgerProgressProps {
  title: string
  description: string
}

export const LedgerProgress = ({ title, description }: LedgerProgressProps) => {
  return (
    <View alignItems="center" gap="$6">
      {/* Circular progress with Ledger icon */}
      <View position="relative" width={150} height={200} alignItems="center" justifyContent="center">
        {/* Spinning progress circle */}
        <Loader size={150} color={getTokenValue('$color.successMainDark')} />

        {/* Ledger icon in center */}
        <View position="absolute" alignItems="center" justifyContent="center">
          <LedgerIcon />
        </View>
      </View>

      {/* Text content */}
      <View alignItems="center" gap="$1">
        <H4 fontWeight="600" color="$color" textAlign="center">
          {title}
        </H4>
        <Text color="$colorSecondary" textAlign="center" paddingTop="$1" paddingHorizontal="$6">
          {description}
        </Text>
      </View>
    </View>
  )
}
