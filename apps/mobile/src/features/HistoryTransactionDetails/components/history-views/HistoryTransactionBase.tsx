import React from 'react'
import { View, YStack, Text } from 'tamagui'
import { TransactionHeader } from '@/src/features/ConfirmTx/components/TransactionHeader'
import { Container } from '@/src/components/Container'
import { Address } from '@/src/types/address'
import { HashDisplay } from '@/src/components/HashDisplay'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Logo } from '@/src/components/Logo'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { IconName } from '@/src/types/iconTypes'
import { BadgeThemeTypes } from '@/src/components/Logo/Logo'

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
  additionalContent?: React.ReactNode
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
  additionalContent,
}: HistoryTransactionBaseProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

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

        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Network</Text>
          <View flexDirection="row" alignItems="center" gap="$2">
            <Logo logoUri={activeChain?.chainLogoUri} size="$6" />
            <Text fontSize="$4">{activeChain?.chainName}</Text>
          </View>
        </View>

        {additionalContent}

        <HistoryAdvancedDetailsButton txId={txId} />
      </Container>
    </YStack>
  )
}
