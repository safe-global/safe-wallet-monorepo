import React from 'react'
import { Text, YStack, XStack } from 'tamagui'
import type { VerifyVariant } from '../utils/verifyStatus'

type Props = {
  variant: VerifyVariant
}

const COPY: Record<VerifyVariant, { title: string; tone: 'positive' | 'neutral' | 'critical' }> = {
  verified: { title: 'Verified dApp', tone: 'positive' },
  unverified: { title: 'Unverified dApp — proceed with caution', tone: 'neutral' },
  malicious: { title: 'This domain has been flagged as malicious', tone: 'critical' },
}

const PERMISSIONS = [
  'See your Safe address and balance',
  'Request approval for transactions',
  'Read on-chain data on your behalf',
]

export const ConnectionPermissionsPanel: React.FC<Props> = ({ variant }) => {
  const { title, tone } = COPY[variant]
  return (
    <YStack gap="$3" padding="$4" borderRadius="$3" backgroundColor="$backgroundSecondary">
      <Text
        fontWeight="600"
        color={tone === 'critical' ? '$error' : tone === 'positive' ? '$success' : '$colorSecondary'}
      >
        {title}
      </Text>
      <YStack gap="$2">
        {PERMISSIONS.map((p) => (
          <XStack key={p} gap="$2">
            <Text>•</Text>
            <Text>{p}</Text>
          </XStack>
        ))}
      </YStack>
    </YStack>
  )
}
