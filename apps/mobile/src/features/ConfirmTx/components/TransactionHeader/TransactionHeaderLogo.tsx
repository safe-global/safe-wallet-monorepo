import React from 'react'
import { Logo } from '@/src/components/Logo'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { IconName } from '@/src/types/iconTypes'
import { BadgeThemeTypes } from '@/src/components/Logo/Logo'
import { Identicon } from '@/src/components/Identicon'
import { Address } from 'blo'
import { DappIcon } from '@/src/features/WalletConnect/Wallet/components/DappIcon'
import { DappOrigin } from '../DappOriginContext'

interface TransactionHeaderLogoProps {
  dappOrigin: DappOrigin | null
  logo?: string
  customLogo?: React.ReactNode
  badgeIcon: IconName
  badgeThemeName?: BadgeThemeTypes
  badgeColor: string
  isIdenticon?: boolean
}

// Picks the right avatar for the header: the dApp logo when the tx came from WalletConnect,
// otherwise an identicon, a caller-provided custom logo, or the contract logo.
export function TransactionHeaderLogo({
  dappOrigin,
  logo,
  customLogo,
  badgeIcon,
  badgeThemeName,
  badgeColor,
  isIdenticon,
}: TransactionHeaderLogoProps) {
  const badge = <SafeFontIcon name={badgeIcon} color={badgeColor} size={12} />

  if (dappOrigin) {
    return <DappIcon url={dappOrigin.logoUri} size={44} badgeContent={badge} badgeThemeName={badgeThemeName} circle />
  }

  if (isIdenticon) {
    return <Identicon address={logo as Address} size={44} />
  }

  return customLogo ?? <Logo logoUri={logo} size="$10" badgeContent={badge} badgeThemeName={badgeThemeName} />
}
