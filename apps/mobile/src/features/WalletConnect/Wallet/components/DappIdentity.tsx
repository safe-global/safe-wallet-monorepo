import React, { useMemo } from 'react'
import { Text, YStack, XStack } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { DappIcon } from './DappIcon'
import { VerifyStatusIcon } from './VerifyStatusIcon'
import type { VerifyVariant } from '../utils/verifyStatus'

type Props = {
  title: string
  name?: string
  url?: string
  iconUrl?: string
  variant: VerifyVariant
  // Optional press handlers — the proposal sheet routes both to its permissions panel; the
  // tx-request sheet has no panel and leaves them undefined (static identity).
  onPressBadge?: () => void
  onPressDomain?: () => void
  domainTestID?: string
}

/**
 * Shared dApp-identity header for the WalletConnect request sheets: title, dApp logo with an
 * overlapping verify badge, name, and a domain pill with an info icon. The presentation is
 * identical across the session-proposal and transaction-request sheets (Figma `16755-4705`);
 * only the title, metadata source and press affordances differ.
 */
export const DappIdentity: React.FC<Props> = ({
  title,
  name,
  url,
  iconUrl,
  variant,
  onPressBadge,
  onPressDomain,
  domainTestID,
}) => {
  // dApp domain without the scheme/trailing slash, e.g. 'https://uniswap.org/' -> 'uniswap.org'.
  const domain = useMemo(() => url?.replace(/^https?:\/\//, '').replace(/\/+$/, '') || url || '', [url])

  return (
    <YStack gap="$5" padding="$4">
      <Text fontSize={20} fontWeight="600" letterSpacing={-0.2} textAlign="center">
        {title}
      </Text>

      <YStack gap="$3" alignItems="center">
        <YStack width={64} height={64}>
          <DappIcon url={iconUrl} size={64} />
          {/* Verify badge overlapping the icon's bottom-right corner. The $background ring
              separates the badge from the dApp icon, matching the design. */}
          <YStack position="absolute" bottom={-4} right={-4} borderRadius={100} backgroundColor="$background">
            <VerifyStatusIcon variant={variant} size={22} onPress={onPressBadge} />
          </YStack>
        </YStack>

        {!!name && (
          <Text fontSize={17} fontWeight="600" textAlign="center">
            {name}
          </Text>
        )}

        {/* Only render the URL pill when the dApp provides one — an empty pill looks broken. */}
        {!!domain && (
          <XStack
            gap="$1"
            alignItems="center"
            paddingVertical="$1"
            paddingHorizontal="$2"
            borderRadius="$8"
            backgroundColor="$backgroundSecondary"
            pressStyle={onPressDomain ? { opacity: 0.6 } : undefined}
            onPress={onPressDomain}
            testID={domainTestID}
          >
            <Text color="$colorSecondary">{domain}</Text>
            <SafeFontIcon name="info" size={14} color="$colorSecondary" />
          </XStack>
        )}
      </YStack>
    </YStack>
  )
}
