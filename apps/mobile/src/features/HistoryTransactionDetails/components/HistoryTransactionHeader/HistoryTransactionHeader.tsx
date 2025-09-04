import { Text, View } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import React from 'react'
import { YStack } from 'tamagui'
import { IconName } from '@/src/types/iconTypes'
import { BadgeThemeTypes } from '@/src/components/Logo/Logo'
import { Identicon } from '@/src/components/Identicon'
import { Address } from '@/src/types/address'

interface HistoryTransactionHeaderProps {
  logo?: string
  customLogo?: React.ReactNode
  badgeIcon: IconName
  badgeThemeName?: BadgeThemeTypes
  badgeColor: string
  isIdenticon?: boolean
  // Optional transaction type to show below the icon
  transactionType?: string | React.ReactNode
  // Optional children to show below the transaction type
  children?: React.ReactNode
}

export function HistoryTransactionHeader({
  logo,
  customLogo,
  badgeIcon,
  badgeThemeName,
  badgeColor,
  isIdenticon,
  transactionType,
  children,
}: HistoryTransactionHeaderProps) {
  return (
    <YStack position="relative" alignItems="center" gap="$3" marginTop="$4">
      {isIdenticon ? (
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

      {transactionType && (
        <View alignItems="center">
          {typeof transactionType === 'string' ? (
            <Text color="$textSecondaryLight" fontSize="$4" fontWeight={500}>
              {transactionType}
            </Text>
          ) : (
            transactionType
          )}
        </View>
      )}

      {children}
    </YStack>
  )
}
