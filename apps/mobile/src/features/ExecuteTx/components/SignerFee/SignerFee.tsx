import { Text, View } from 'tamagui'

interface SignerFeeProps {
  totalFee: string
  totalFeeRaw: bigint
  currencySymbol?: string
  onPress?: () => void
}

export const SignerFee = ({ totalFee, totalFeeRaw, currencySymbol, onPress }: SignerFeeProps) => {
  return (
    <View flexDirection="row" alignItems="center" onPress={onPress}>
      <View borderStyle="dashed" borderBottomWidth={totalFeeRaw ? 1 : 0} borderColor="$color">
        {totalFeeRaw ? (
          <Text fontWeight={700}>
            {totalFee} {currencySymbol}
          </Text>
        ) : (
          <Text color="$error" fontWeight={700}>
            Can not estimate
          </Text>
        )}
      </View>
    </View>
  )
}
