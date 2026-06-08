import React from 'react'
import { Text, YStack, XStack } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import type { IconName } from '@/src/types/iconTypes'
import type { VerifyVariant } from '../utils/verifyStatus'
import { VerifyStatusIcon } from './VerifyStatusIcon'

type Props = {
  variant: VerifyVariant
  onDismiss: () => void
}

type PermissionRow = { allowed: boolean; text: string }

const CAN: PermissionRow[] = [
  { allowed: true, text: 'View your balance and activity' },
  { allowed: true, text: 'Request transactions approval' },
]

const CANNOT: PermissionRow[] = [{ allowed: false, text: 'Move funds without permission' }]

// Three copy variants over a binary colour: verified is green, unverified/malicious share
// the red error treatment (the linked Figma has no distinct malicious colour). Malicious
// copy mirrors the web wallet's ProposalVerification scam message.
const BANNER_COPY: Record<VerifyVariant, string> = {
  verified: 'This domain has been verified.',
  unverified: 'This domain could not be verified.',
  malicious: 'This domain is flagged as a known scam.',
}

const Row: React.FC<PermissionRow> = ({ allowed, text }) => {
  const icon: IconName = allowed ? 'check' : 'close'
  return (
    <XStack gap={10} paddingHorizontal="$2" alignItems="center">
      <SafeFontIcon name={icon} size={16} color={allowed ? '$success' : '$error'} />
      <Text flex={1} fontSize={16} lineHeight={22}>
        {text}
      </Text>
    </XStack>
  )
}

export const ConnectionPermissionsPanel: React.FC<Props> = ({ variant, onDismiss }) => {
  const isVerified = variant === 'verified'

  return (
    <YStack gap="$4" paddingHorizontal="$4" paddingTop="$2" paddingBottom="$4">
      <Text fontSize={20} fontWeight="600" letterSpacing={-0.2} textAlign="center">
        Connection request
      </Text>

      <YStack gap="$8">
        <YStack gap="$6">
          <XStack
            gap="$3"
            paddingHorizontal="$3"
            paddingVertical="$4"
            borderRadius="$4"
            alignItems="center"
            backgroundColor={isVerified ? '$successBackground' : '$errorBackground'}
          >
            <VerifyStatusIcon variant={variant} size={24} />
            <Text flex={1} fontSize={16} fontWeight="700" lineHeight={22}>
              {BANNER_COPY[variant]}
            </Text>
          </XStack>

          <YStack gap="$2">
            <Text paddingHorizontal="$2" fontSize={16} lineHeight={22} color="$colorSecondary">
              This website will be able to:
            </Text>
            {CAN.map((row) => (
              <Row key={row.text} {...row} />
            ))}
          </YStack>

          <YStack gap="$2">
            <Text paddingHorizontal="$2" fontSize={16} lineHeight={22} color="$colorSecondary">
              This website won't be able to:
            </Text>
            {CANNOT.map((row) => (
              <Row key={row.text} {...row} />
            ))}
          </YStack>

          {!isVerified && (
            <Text paddingHorizontal="$2" fontSize={16} fontWeight="700" lineHeight={22}>
              Only continue if you trust the source.
            </Text>
          )}
        </YStack>

        <SafeButton primary onPress={onDismiss} testID="wc-proposal-permissions-dismiss">
          Got it
        </SafeButton>
      </YStack>
    </YStack>
  )
}
