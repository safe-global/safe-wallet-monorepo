import { Text, View } from 'tamagui'

interface SignerFeeProps {
  totalFee: string
  willFail?: boolean
  currencySymbol?: string
  onPress?: () => void
}

export const SignerFee = ({ totalFee, currencySymbol, onPress, willFail }: SignerFeeProps) => {
  return (
    <View flexDirection="row" alignItems="center" onPress={onPress}>
      <View borderStyle="dashed" borderBottomWidth={willFail ? 0 : 1} borderColor="$color">
        {willFail ? (
          <Text color="$error" fontWeight={700}>
            Can not estimate
          </Text>
        ) : (
          <Text fontWeight={700}>
            {totalFee} {currencySymbol}
          </Text>
        )}
      </View>
    </View>
  )
}
