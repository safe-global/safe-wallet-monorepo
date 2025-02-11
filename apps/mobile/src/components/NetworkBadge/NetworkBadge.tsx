import { Text, Theme, View } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

type Props = {
  network: Chain
}

export const NetworkBadge = ({ network }: Props) => {
  return (
    <Theme name={'network_badge'}>
      <View
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        backgroundColor="$background"
        borderRadius="$10"
        paddingLeft="$1"
        paddingRight="$3"
        paddingVertical="$1"
      >
        <Logo size={'$6'} logoUri={network.chainLogoUri} />
        <Text marginLeft={'$2'}>{network.chainName}</Text>
      </View>
    </Theme>
  )
}
