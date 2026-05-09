import { Address } from '@/src/types/address'
import { shortenAddress } from '@/src/utils/formatters'
import { GetThemeValueForKey, Text, type TextProps, View } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { OpaqueColorValue } from 'react-native'

type Props = {
  address: Address
  copy?: boolean
  textProps?: Partial<TextProps>
  copyProps?: Partial<{
    color: 'unset' | GetThemeValueForKey<'color'> | OpaqueColorValue | undefined
    size: number
  }>
}
export const EthAddress = ({ address, copy, textProps, copyProps }: Props) => {
  return (
    <View gap={'$1'} flexDirection={'row'} alignItems={'center'}>
      <Text color={'$color'} {...textProps}>
        {shortenAddress(address)}
      </Text>
      {copy && (
        <CopyButton value={address} size={copyProps?.size} color={copyProps?.color || textProps?.color || '$color'} />
      )}
    </View>
  )
}
