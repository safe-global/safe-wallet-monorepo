import { Logo } from '@/src/components/Logo'
import { ellipsis } from '@/src/utils/formatters'
import { Text, View } from 'tamagui'

import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NormalizedSettingsChangeTransaction } from '../../ConfirmationView/types'
import { HashDisplay } from '@/src/components/HashDisplay'

export const getSignerName = (txInfo: NormalizedSettingsChangeTransaction) => {
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
  txInfo: NormalizedSettingsChangeTransaction,
  chain: Chain,
  executionInfo: MultisigExecutionDetails,
) => {
  const items = [
    {
      label: 'New signer',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <HashDisplay value={txInfo.settingsInfo?.owner?.value} />
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

  const hasThresholdChanged = txInfo.settingsInfo?.threshold !== executionInfo.confirmationsRequired
  if (hasThresholdChanged) {
    items.push({
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
    })
  }

  return items
}
