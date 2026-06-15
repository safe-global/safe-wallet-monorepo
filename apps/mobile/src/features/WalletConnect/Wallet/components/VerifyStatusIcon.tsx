import React from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import type { IconName } from '@/src/types/iconTypes'
import type { VerifyVariant } from '../utils/verifyStatus'

type Props = {
  variant: VerifyVariant
  size?: number
  onPress?: () => void
}

// Verify-status glyph shared by the proposal sheet's icon badge and the permissions
// panel's banner: a green filled check when the domain is verified, a red filled alert
// circle otherwise (unverified / malicious).
export const VerifyStatusIcon: React.FC<Props> = ({ variant, size = 22, onPress }) => {
  const isVerified = variant === 'verified'
  const name: IconName = isVerified ? 'check-filled' : 'alert-circle-filled'
  return <SafeFontIcon name={name} size={size} color={isVerified ? '$success' : '$error'} onPress={onPress} />
}
