import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Logo } from '@/src/components/Logo'

import { Badge } from '@/src/components/Badge'
import { ellipsis } from '@/src/utils/formatters'
import { CircleProps, Text, View } from 'tamagui'
import { CustomTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { CopyButton } from '@/src/components/CopyButton'
import { TouchableOpacity } from 'react-native'

const mintBadgeProps: CircleProps = { borderRadius: '$2', paddingHorizontal: '$2', paddingVertical: '$1' }

export const formatContractItems = (txInfo: CustomTransactionInfo, chain: Chain, viewOnExplorer: () => void) => {
  const contractName = txInfo.to.name ? ellipsis(txInfo.to.name, 18) : shortenAddress(txInfo.to.value)

  return [
    {
      label: 'Call',
      render: () => (
        <Badge
          circleProps={mintBadgeProps}
          themeName="badge_background"
          fontSize={12}
          circular={false}
          content={txInfo.methodName ?? ''}
        />
      ),
    },
    {
      label: 'Contract',
      render: () => {
        return (
          <View flexDirection="row" alignItems="center" gap="$2">
            <Logo logoUri={txInfo.to.logoUri} size="$6" />
            <Text fontSize="$4">{contractName}</Text>
            <CopyButton value={txInfo.to.value} color={'$textSecondaryLight'} />

            <TouchableOpacity onPress={viewOnExplorer}>
              <SafeFontIcon name="external-link" size={14} color="$textSecondaryLight" />
            </TouchableOpacity>
          </View>
        )
      },
    },
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
