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

interface TransactionHeaderProps {
  logo?: string
  badgeIcon: IconName
  badgeThemeName?: BadgeThemeTypes
  badgeColor: string
  title: string | React.ReactNode
  isIdenticon?: boolean
  submittedAt: number
}

export function TransactionHeader({
  logo,
  badgeIcon,
  badgeThemeName,
  badgeColor,
  title,
  isIdenticon,
  submittedAt,
}: TransactionHeaderProps) {
  const date = formatWithSchema(submittedAt, 'MMM d yyyy')
  const time = formatWithSchema(submittedAt, 'hh:mm a')

  return (
    <YStack position="relative" alignItems="center" gap="$2" marginTop="$4">
      {isIdenticon ? (
        <Identicon address={logo as Address} size={44} />
      ) : (
        <Logo
          logoUri={logo}
          size="$10"
          badgeContent={<SafeFontIcon name={badgeIcon} color={badgeColor} size={12} />}
          badgeThemeName={badgeThemeName}
        />
      )}

      <View alignItems="center" gap="$1">
        {typeof title === 'string' ? <H3 fontWeight={600}>{title}</H3> : title}
        <Text color="$textSecondaryLight">
          {date} at {time}
        </Text>
      </View>
    </YStack>
  )
}
