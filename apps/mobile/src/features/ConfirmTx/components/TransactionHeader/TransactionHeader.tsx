import { H3, Text, View } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import React from 'react'
import { YStack } from 'tamagui'
import { IconName } from '@/src/types/iconTypes'
import { BadgeThemeTypes } from '@/src/components/Logo/Logo'
import { Identicon } from '@/src/components/Identicon'
import { Address } from 'blo'
import { formatWithSchema } from '@/src/utils/date'
import { DappIcon } from '@/src/features/WalletConnect/Wallet/components/DappIcon'
import { useDappOrigin } from '../DappOriginContext'

interface TransactionHeaderProps {
  logo?: string
  customLogo?: React.ReactNode
  badgeIcon: IconName
  badgeThemeName?: BadgeThemeTypes
  badgeColor: string
  title: string | React.ReactNode
  isIdenticon?: boolean
  submittedAt: number
}

export function TransactionHeader({
  logo,
  customLogo,
  badgeIcon,
  badgeThemeName,
  badgeColor,
  title,
  isIdenticon,
  submittedAt,
}: TransactionHeaderProps) {
  const date = formatWithSchema(submittedAt, 'd MMM yyyy')
  const time = formatWithSchema(submittedAt, 'hh:mm a')
  const dappOrigin = useDappOrigin()
  const showTitle = dappOrigin?.name ?? title

  return (
    <YStack position="relative" alignItems="center" gap="$2" marginTop="$4">
      {dappOrigin ? (
        <DappIcon
          url={dappOrigin.logoUri}
          size={44}
          badgeContent={<SafeFontIcon name={badgeIcon} color={badgeColor} size={12} />}
          badgeThemeName={badgeThemeName}
          circle
        />
      ) : isIdenticon ? (
        <Identicon address={logo as Address} size={44} />
      ) : (
        (customLogo ?? (
          <Logo
            logoUri={logo}
            size="$10"
            badgeContent={<SafeFontIcon name={badgeIcon} color={badgeColor} size={12} />}
            badgeThemeName={badgeThemeName}
          />
        ))
      )}

      <View alignItems="center" gap="$2">
        {typeof showTitle === 'string' ? (
          <H3 fontWeight={600} fontSize="$7" textAlign="center">
            {showTitle}
          </H3>
        ) : (
          showTitle
        )}
        <Text color="$textSecondaryLight" fontSize="$2" lineHeight={16}>
          {date}, {time}
        </Text>
      </View>
    </YStack>
  )
}
