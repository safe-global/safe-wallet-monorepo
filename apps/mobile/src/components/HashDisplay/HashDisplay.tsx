import React from 'react'
import { View, Text } from 'tamagui'
import { TouchableOpacity } from 'react-native'
import { Identicon } from '@/src/components/Identicon'
import { EthAddress } from '@/src/components/EthAddress'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { Address } from '@/src/types/address'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { CopyButton } from '@/src/components/CopyButton'
import type { TextProps } from 'tamagui'

export interface HashDisplayProps {
  value: string | Address
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
  /** Whether to treat the value as an address (shows identicon) or generic hash */
  isAddress?: boolean
}

export function HashDisplay({
  value,
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
  isAddress = true, // Default to true for backward compatibility
}: HashDisplayProps) {
  const defaultViewOnExplorer = useOpenExplorer(value)
  const handleExternalLinkPress = onExternalLinkPress || defaultViewOnExplorer

  return (
    <View flexDirection="row" alignItems="center" gap={gap}>
      {showIdenticon && isAddress && <Identicon address={value as Address} size={identiconSize} />}

      {isAddress ? (
        <EthAddress
          address={value as Address}
          copy={showCopy}
          textProps={textProps}
          copyProps={{
            color: '$textSecondaryLight',
            size: copyIconSize,
            ...copyProps,
          }}
        />
      ) : (
        <View flexDirection="row" alignItems="center" gap="$1">
          <Text {...textProps}>{shortenAddress(value)}</Text>
          {showCopy && (
            <CopyButton value={value} size={copyIconSize} color={copyProps?.color || '$textSecondaryLight'} />
          )}
        </View>
      )}

      {showExternalLink && (
        <TouchableOpacity onPress={handleExternalLinkPress}>
          <SafeFontIcon name="external-link" size={externalLinkSize} color={externalLinkColor} />
        </TouchableOpacity>
      )}
    </View>
  )
}
