import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Logo } from '@/src/components/Logo'
import { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { ellipsis } from '@/src/utils/formatters'
import { Text, View } from 'tamagui'
import { Address } from '@/src/types/address'
import { Identicon } from '@/src/components/Identicon'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { TouchableOpacity } from 'react-native'
import useOpenExplorer from '@/src/features/ConfirmTx/hooks/useOpenExplorer/useOpenExplorer'

export const formatSendNFTItems = (txInfo: TransferTransactionInfo, chain: Chain) => {
  const viewOnExplorer = useOpenExplorer(txInfo.recipient.value)

  return [
    {
      label: 'New signer',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Identicon address={txInfo.recipient.value as Address} size={24} />
          <Text fontSize="$4">
            {txInfo.recipient.name ? ellipsis(txInfo.recipient.name, 18) : shortenAddress(txInfo.recipient.value)}
          </Text>
          <SafeFontIcon name="copy" size={14} color="textSecondaryLight" />
          <TouchableOpacity onPress={viewOnExplorer}>
            <SafeFontIcon name="external-link" size={14} color="textSecondaryLight" />
          </TouchableOpacity>
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
