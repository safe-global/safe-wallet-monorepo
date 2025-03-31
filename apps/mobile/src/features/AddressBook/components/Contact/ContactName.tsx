import { EthAddress } from '@/src/components/EthAddress/ETHAddress'
import { Text, type TextProps, View } from 'tamagui'

type Props = {
  name?: string
  address: `0x${string}`
  textProps?: Partial<TextProps>
}
export const ContactName = ({ name, address, textProps }: Props) => {
  return name ? (
    <View>
      <Text fontWeight={500} {...textProps}>
        {name}
      </Text>
    </View>
  ) : (
    <EthAddress address={address} />
  )
}
