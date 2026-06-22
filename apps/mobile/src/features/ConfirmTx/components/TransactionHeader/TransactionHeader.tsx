import { H3, Text, View } from 'tamagui'
import React from 'react'
import { YStack } from 'tamagui'
import { IconName } from '@/src/types/iconTypes'
import { BadgeThemeTypes } from '@/src/components/Logo/Logo'
import { formatWithSchema } from '@/src/utils/date'
import { useDappOrigin } from '../DappOriginContext'
import { TransactionHeaderLogo } from './TransactionHeaderLogo'

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
  // When the tx originates from a WalletConnect dApp, surface its logo + name in place of the
  // contract logo/title (Figma `5316-26402`). Absent provider (history, native flows) → no-op.
  const dappOrigin = useDappOrigin()
  // `||` not `??`: a dApp publishing metadata.name = '' must not blank the header.
  const showTitle = dappOrigin?.name || title

  return (
    <YStack position="relative" alignItems="center" gap="$2" marginTop="$4">
      <TransactionHeaderLogo
        dappOrigin={dappOrigin}
        logo={logo}
        customLogo={customLogo}
        badgeIcon={badgeIcon}
        badgeThemeName={badgeThemeName}
        badgeColor={badgeColor}
        isIdenticon={isIdenticon}
      />

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
