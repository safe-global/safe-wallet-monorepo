import { Logo } from '@/src/components/Logo'
import { Text, View } from 'tamagui'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

export const formatCancelTxItems = (chain: Chain) => {
  return [
    {
      label: 'Network',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Logo logoUri={chain.chainLogoUri} size="$6" />
          <Text fontSize="$4">{chain.chainName}</Text>
        </View>
      ),
    },
  ]
}
