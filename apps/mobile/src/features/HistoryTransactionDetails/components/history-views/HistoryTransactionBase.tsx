import React from 'react'
import { View, YStack, Text } from 'tamagui'
import { TransactionHeader } from '@/src/features/ConfirmTx/components/TransactionHeader'
import { Container } from '@/src/components/Container'
import { Address } from '@/src/types/address'
import { HashDisplay } from '@/src/components/HashDisplay'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { IconName } from '@/src/types/iconTypes'
import { BadgeThemeTypes } from '@/src/components/Logo/Logo'
import { NetworkDisplay } from '../shared'

interface HistoryTransactionBaseProps {
  txId: string
  executedAt: number
  recipientAddress?: Address
  // Header props
  logo?: string
  customLogo?: React.ReactNode
  badgeIcon: IconName
  badgeThemeName?: BadgeThemeTypes
  badgeColor: string
  title: string | React.ReactNode
  isIdenticon?: boolean
  // Optional description text between header and details
  description?: string | React.ReactNode
  // Optional additional content in the details container
  children?: React.ReactNode
}

export function HistoryTransactionBase({
  txId,
  executedAt,
  recipientAddress,
  logo,
  customLogo,
  badgeIcon,
  badgeThemeName,
  badgeColor,
  title,
  isIdenticon,
  description,
  children,
}: HistoryTransactionBaseProps) {
  return (
    <YStack gap="$4">
      <TransactionHeader
        logo={logo}
        customLogo={customLogo}
        badgeIcon={badgeIcon}
        badgeThemeName={badgeThemeName}
        badgeColor={badgeColor}
        title={title}
        isIdenticon={isIdenticon}
        submittedAt={executedAt}
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
