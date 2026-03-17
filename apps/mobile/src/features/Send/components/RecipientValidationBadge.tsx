import React from 'react'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import type { RecipientValidationState } from '../hooks/useRecipientValidation'

interface RecipientValidationBadgeProps {
  state: RecipientValidationState
  contactName?: string
}

const stateConfig: Record<
  Exclude<RecipientValidationState, 'empty' | 'typing'>,
  { color: string; bg: string; icon: string; label: string }
> = {
  known: { color: '$success', bg: '$successBackground', icon: 'check', label: '' },
  unknown: { color: '$info', bg: '$infoBackground', icon: 'info', label: 'Unknown recipient' },
  invalid: { color: '$error', bg: '$errorBackground', icon: 'alert', label: 'Invalid recipient' },
  'self-send': {
    color: '$warning',
    bg: '$warningBackground',
    icon: 'alert',
    label: 'Sending to your own Safe',
  },
  suspicious: {
    color: '$warning',
    bg: '$warningBackground',
    icon: 'alert',
    label: 'Suspicious recipient',
  },
  'known-other-chain': {
    color: '$warning',
    bg: '$warningBackground',
    icon: 'alert',
    label: 'Known on another network',
  },
}

export function RecipientValidationBadge({ state, contactName }: RecipientValidationBadgeProps) {
  if (state === 'empty' || state === 'typing') {
    return null
  }

  const config = stateConfig[state]
  const label = state === 'known' && contactName ? contactName : config.label

  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap="$2"
      paddingVertical="$1"
      paddingHorizontal="$2"
      borderRadius="$2"
      backgroundColor={config.bg}
    >
      <SafeFontIcon name={config.icon as 'check'} size={14} color={config.color} />
      <Text fontSize="$2" color={config.color}>
        {label}
      </Text>
    </View>
  )
}
