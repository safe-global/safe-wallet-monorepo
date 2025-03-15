import { bloSvg } from 'blo'
import { type Address } from '@/src/types/address'
import { View } from 'tamagui'
import { SvgXml } from 'react-native-svg'

type Props = {
  address: Address
  rounded?: boolean
  size?: number
}

const DEFAULT_SIZE = 56
export const Identicon = ({ address, rounded = true, size }: Props) => {
  size = size ? size : DEFAULT_SIZE

  const blockieSvg = bloSvg(address)

  return (
    <View style={{ borderRadius: rounded ? '50%' : 0, overflow: 'hidden' }} testID={'identicon-image-container'}>
      <SvgXml testID={'identicon-image'} xml={blockieSvg} width={size} height={size} />
    </View>
  )
}
