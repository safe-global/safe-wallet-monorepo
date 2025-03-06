import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Logo } from '@/src/components/Logo'
import { Text, View } from 'tamagui'

import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Identicon } from '@/src/components/Identicon'
import { getSignerName } from '../AddSigner/utils'

import { NormalizedSettingsChangeTransaction } from '../../ConfirmationView/types'

export const formatRemoveSignerItems = (txInfo: NormalizedSettingsChangeTransaction, chain: Chain) => {
  const newRemovedSigners = getSignerName(txInfo)

  return [
    {
      label: 'Removed signer',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Identicon address={txInfo.settingsInfo?.owner?.value} size={24} />
          <Text fontSize="$4">{newRemovedSigners}</Text>
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
