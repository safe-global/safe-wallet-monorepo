import React from 'react'
import { View, YStack, Text } from 'tamagui'
import { HistoryTransactionHeader } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionHeader'
import { Container } from '@/src/components/Container'
import { Address } from '@/src/types/address'
import { HashDisplay } from '@/src/components/HashDisplay'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { IconName } from '@/src/types/iconTypes'
import { BadgeThemeTypes } from '@/src/components/Logo/Logo'
import { NetworkDisplay } from '../shared'

interface HistoryTransactionBaseProps {
  txId: string
  recipientAddress?: Address
  // Header props
  logo?: string
  customLogo?: React.ReactNode
  badgeIcon: IconName
  badgeThemeName?: BadgeThemeTypes
  badgeColor: string
  isIdenticon?: boolean
  // Transaction type to show below the icon
  transactionType?: string | React.ReactNode
  // Optional description text between header and details
  description?: string | React.ReactNode
  // Optional additional content in the details container
  children?: React.ReactNode
}

export function HistoryTransactionBase({
  txId,
  recipientAddress,
  logo,
  customLogo,
  badgeIcon,
  badgeThemeName,
  badgeColor,
  isIdenticon,
  transactionType,
  description,
  children,
}: HistoryTransactionBaseProps) {
  return (
    <YStack gap="$4">
      <HistoryTransactionHeader
        logo={logo}
        customLogo={customLogo}
        badgeIcon={badgeIcon}
        badgeThemeName={badgeThemeName}
        badgeColor={badgeColor}
        isIdenticon={isIdenticon}
        transactionType={transactionType}
      />

      {description && (typeof description === 'string' ? <Text fontSize="$4">{description}</Text> : description)}

      <Container padding="$4" gap="$4" borderRadius="$3">
        {recipientAddress && (
          <View alignItems="center" flexDirection="row" justifyContent="space-between">
            <Text color="$textSecondaryLight">To</Text>
            <HashDisplay value={recipientAddress} />
          </View>
        )}

        <NetworkDisplay />

        {children}

        <HistoryAdvancedDetailsButton txId={txId} />
      </Container>
    </YStack>
  )
}
