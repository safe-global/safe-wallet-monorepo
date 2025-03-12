import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Logo } from '@/src/components/Logo'

import { Badge } from '@/src/components/Badge'
import { ellipsis } from '@/src/utils/formatters'
import { CircleProps, Text, View } from 'tamagui'
import { shortenAddress } from '@safe-global/utils/formatters'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import {
  MultisigExecutionDetails,
  SettingsChangeTransaction,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Identicon } from '@/src/components/Identicon'
import { Address } from '@/src/types/address'
import { CopyButton } from '@/src/components/CopyButton'

const mintBadgeProps: CircleProps = { borderRadius: '$2', paddingHorizontal: '$2', paddingVertical: '$1' }

export const formatGenericViewItems = ({
  txInfo,
  txData,
  chain,
  executionInfo,
}: {
  txInfo: SettingsChangeTransaction
  txData: TransactionData
  chain: Chain
  executionInfo: MultisigExecutionDetails
}) => {
  const genericViewName = txData.to.name ? ellipsis(txData.to.name, 18) : shortenAddress(txData.to.value)

  const items = [
    {
      label: 'Call',
      render: () => (
        <Badge
          circleProps={mintBadgeProps}
          themeName="badge_background"
          fontSize={12}
          circular={false}
          content={txData.dataDecoded?.method ?? ''}
        />
      ),
    },
    {
      label: 'Contract',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          {txData.to.logoUri ? (
            <Logo logoUri={txData.to.logoUri} size="$6" />
          ) : (
            <Identicon address={txData.to.value as Address} size={24} />
          )}
          <Text fontSize="$4">{genericViewName}</Text>
          <CopyButton value={txData.to.value} color={'$textSecondaryLight'} />
          <SafeFontIcon name="external-link" size={14} color="textSecondaryLight" />
        </View>
      ),
    },
  ]

  if (txInfo.settingsInfo?.type === 'CHANGE_THRESHOLD') {
    items.push({
      label: 'Token',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          {txInfo.settingsInfo && 'threshold' in txInfo.settingsInfo && (
            <Text fontSize="$4">
              {txInfo.settingsInfo?.threshold}/{executionInfo.signers.length}
            </Text>
          )}

          {txInfo.settingsInfo && 'threshold' in txInfo.settingsInfo && (
            <Text textDecorationLine="line-through" color="$textSecondaryLight" fontSize="$4">
              {executionInfo.confirmationsRequired}/{executionInfo.signers.length}
            </Text>
          )}
        </View>
      ),
    })
  }

  items.push({
    label: 'Network',
    render: () => (
      <View flexDirection="row" alignItems="center" gap="$2">
        <Logo logoUri={chain.chainLogoUri} size="$6" />
        <Text fontSize="$4">{chain.chainName}</Text>
      </View>
    ),
  })

  return items
}
