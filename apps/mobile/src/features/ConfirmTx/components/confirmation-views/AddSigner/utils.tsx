import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Logo } from '@/src/components/Logo'
import { ellipsis } from '@/src/utils/formatters'
import { Text, View } from 'tamagui'

import {
  MultisigExecutionDetails,
  SettingsChangeTransaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { shortenAddress } from '@safe-global/utils/formatters'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Identicon } from '@/src/components/Identicon'

export const getSignerName = (txInfo: SettingsChangeTransaction) => {
  if (!txInfo.settingsInfo) {
    return ''
  }

  const newSigner = 'owner' in txInfo.settingsInfo && txInfo.settingsInfo.owner

  if (!newSigner) {
    return ''
  }

  return newSigner.name ? ellipsis(newSigner.name, 18) : shortenAddress(newSigner.value)
}

export const formatAddSignerItems = (
  txInfo: SettingsChangeTransaction,
  chain: Chain,
  executionInfo: MultisigExecutionDetails,
) => {
  const newSignerAddress = getSignerName(txInfo)

  return [
    {
      label: 'New Signer',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Identicon address={txInfo.settingsInfo?.owner?.value} size={24} />
          <Text fontSize="$4">{newSignerAddress}</Text>
          <SafeFontIcon name="copy" size={14} color="textSecondaryLight" />
          <SafeFontIcon name="external-link" size={14} color="textSecondaryLight" />
        </View>
      ),
    },
    {
      label: 'Threshold change',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text fontSize="$4">
            {txInfo.settingsInfo?.threshold}/{executionInfo.signers.length}
          </Text>
          <Text textDecorationLine="line-through" color="$textSecondaryLight" fontSize="$4">
            {executionInfo.confirmationsRequired}/{executionInfo.signers.length}
          </Text>
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
