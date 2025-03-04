import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Logo } from '@/src/components/Logo'

import { Badge } from '@/src/components/Badge'
import { ellipsis } from '@/src/utils/formatters'
import { CircleProps, Text, View } from 'tamagui'
import { CustomTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { shortenAddress } from '@safe-global/utils/formatters'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const mintBadgeProps: CircleProps = { borderRadius: '$2', paddingHorizontal: '$2', paddingVertical: '$1' }

export const formatContractItems = (txInfo: CustomTransactionInfo, chain: Chain) => {
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
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Logo logoUri={txInfo.to.logoUri} size="$6" />
          <Text fontSize="$4">{contractName}</Text>
          <SafeFontIcon name="copy" size={14} color="textSecondaryLight" />
          <SafeFontIcon name="external-link" size={14} color="textSecondaryLight" />
        </View>
      ),
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
