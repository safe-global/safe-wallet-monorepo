import React from 'react'
import { View } from 'tamagui'
import { TouchableOpacity } from 'react-native'
import { Identicon } from '@/src/components/Identicon'
import { EthAddress } from '@/src/components/EthAddress'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { Address } from '@/src/types/address'
import type { TextProps } from 'tamagui'

export interface AddressDisplayProps {
  address: Address
  showIdenticon?: boolean
  showCopy?: boolean
  showExternalLink?: boolean
  identiconSize?: number
  copyIconSize?: number
  externalLinkSize?: number
  textProps?: Partial<TextProps>
  copyProps?: {
    color?: string
    size?: number
  }
  externalLinkColor?: string
  /** Gap between elements */
  gap?: string
  onExternalLinkPress?: () => void
}

export function AddressDisplay({
  address,
  showIdenticon = true,
  showCopy = true,
  showExternalLink = true,
  identiconSize = 24,
  copyIconSize = 16,
  externalLinkSize = 16,
  textProps,
  copyProps,
  externalLinkColor = '$textSecondaryLight',
  gap = '$2',
  onExternalLinkPress,
}: AddressDisplayProps) {
  const defaultViewOnExplorer = useOpenExplorer(address)
  const handleExternalLinkPress = onExternalLinkPress || defaultViewOnExplorer

  return (
    <View flexDirection="row" alignItems="center" gap={gap}>
      {showIdenticon && <Identicon address={address} size={identiconSize} />}

      <EthAddress
        address={address}
        copy={showCopy}
        textProps={textProps}
        copyProps={{
          color: '$textSecondaryLight',
          size: copyIconSize,
          ...copyProps,
        }}
      />

      {showExternalLink && (
        <TouchableOpacity onPress={handleExternalLinkPress}>
          <SafeFontIcon name="external-link" size={externalLinkSize} color={externalLinkColor} />
        </TouchableOpacity>
      )}
    </View>
  )
}
