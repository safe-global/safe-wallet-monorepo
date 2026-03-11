import React from 'react'
import { Linking, TouchableOpacity } from 'react-native'
import { Text, View } from 'tamagui'
import { shortenAddress } from '@/src/utils/formatters'
import { Identicon } from '@/src/components/Identicon/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectChainById } from '@/src/store/chains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import type { Address } from '@/src/types/address'
import type { RootState } from '@/src/store'

interface RecipientDisplayProps {
  address: string
  name?: string
}

export function RecipientDisplay({ name, address }: RecipientDisplayProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const copyAddress = useCopyAndDispatchToast()

  const handleOpenExplorer = () => {
    const link = getExplorerLink(address, activeChain.blockExplorerUriTemplate)
    Linking.openURL(link.href)
  }

  return (
    <View flexDirection="row" alignItems="center" gap="$3" flex={1}>
      <Identicon address={address as Address} size={32} />
      <TouchableOpacity onPress={() => copyAddress(address)} style={{ flex: 1 }} testID="copy-address">
        <View gap={2}>
          {name ? (
            <>
              <Text
                fontSize="$4"
                fontWeight={600}
                color="$color"
                numberOfLines={1}
                ellipsizeMode="tail"
                testID="recipient-name"
              >
                {name}
              </Text>
              <Text fontSize="$3" color="$colorSecondary">
                {shortenAddress(address, 4)}
              </Text>
            </>
          ) : (
            <Text fontSize="$4" color="$color">
              {shortenAddress(address, 6)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleOpenExplorer} hitSlop={8} testID="explorer-link-button">
        <SafeFontIcon name="external-link" size={24} color="$colorSecondary" />
      </TouchableOpacity>
    </View>
  )
}
