import React from 'react'
import { View, Text } from 'tamagui'
import { TouchableOpacity } from 'react-native'
import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { Address } from '@/src/types/address'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { CopyButton } from '@/src/components/CopyButton'
import { Logo } from '@/src/components/Logo'
import { useDisplayName } from '@/src/hooks/useDisplayName'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TextProps } from 'tamagui'
import { isAddress } from 'ethers'

type HashDisplaySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface SizeConfig {
  identicon: number
  logo: string
  icon: number
  gap: string
}

const SIZE_CONFIGS: Record<HashDisplaySize, SizeConfig> = {
  xs: { identicon: 16, logo: '$4', icon: 12, gap: '$1' },
  sm: { identicon: 20, logo: '$5', icon: 14, gap: '$1.5' },
  md: { identicon: 24, logo: '$6', icon: 16, gap: '$2' },
  lg: { identicon: 32, logo: '$8', icon: 20, gap: '$2.5' },
  xl: { identicon: 40, logo: '$10', icon: 24, gap: '$3' },
}

export interface HashDisplayProps {
  value: string | Address | AddressInfo
  /**
   * Whether to show visual identifier (logo or identicon)
   * - If logo is available (from AddressInfo), shows logo
   * - Otherwise shows identicon for addresses
   * - For non-addresses, no visual identifier is shown
   * @default true
   */
  showVisualIdentifier?: boolean
  showCopy?: boolean
  showExternalLink?: boolean
  /**
   * Size variant that controls all visual elements proportionally
   * @default 'md'
   */
  size?: HashDisplaySize
  textProps?: Partial<TextProps>
  /**
   * Color applied to both copy and external link icons
   * @default '$textSecondaryLight'
   */
  iconColor?: string
  onExternalLinkPress?: () => void
}

export function HashDisplay({
  value,
  showVisualIdentifier = true,
  showCopy = true,
  showExternalLink = true,
  size = 'md',
  textProps,
  iconColor = '$textSecondaryLight',
  onExternalLinkPress,
}: HashDisplayProps) {
  const {
    displayName,
    address: addressValue,
    logoUri: resolvedLogoUri,
  } = useDisplayName({
    value,
  })

  const sizeConfig = SIZE_CONFIGS[size]

  const isAddressValue = isAddress(addressValue)

  const defaultViewOnExplorer = useOpenExplorer(addressValue)
  const handleExternalLinkPress = onExternalLinkPress || defaultViewOnExplorer

  return (
    <View flexDirection="row" alignItems="center" gap={sizeConfig.gap}>
      {/* Always prefer logo over identicon when both are available */}
      <View flexDirection="row">
        {showVisualIdentifier && (
          <>
            {resolvedLogoUri ? (
              <Logo logoUri={resolvedLogoUri} size={sizeConfig.logo} />
            ) : (
              isAddressValue && <Identicon address={addressValue as Address} size={sizeConfig.identicon} />
            )}
          </>
        )}
      </View>

      {/* Display name or shortened address/hash */}
      <View flexDirection="row" alignItems="center" gap="$1">
        <Text {...textProps} maxWidth={150} numberOfLines={1} ellipsizeMode="tail">
          {displayName || shortenAddress(addressValue)}
        </Text>
        {showCopy && <CopyButton value={addressValue} size={sizeConfig.icon} color={iconColor} />}
      </View>

      {showExternalLink && (
        <TouchableOpacity onPress={handleExternalLinkPress}>
          <SafeFontIcon name="external-link" size={sizeConfig.icon} color={iconColor} />
        </TouchableOpacity>
      )}
    </View>
  )
}
