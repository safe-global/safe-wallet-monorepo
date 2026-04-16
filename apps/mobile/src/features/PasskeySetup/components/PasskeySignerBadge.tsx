import React from 'react'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface PasskeySignerBadgeProps {
  size?: number
  fontSize?: number
  testID?: string
}

export const PasskeySignerBadge = ({ size = 24, fontSize = 10, testID }: PasskeySignerBadgeProps) => (
  <Badge
    content={<SafeFontIcon name="fingerprint" size={12} color="$color" />}
    textContentProps={{
      fontSize,
      fontWeight: 500,
    }}
    circleSize={size}
    themeName="badge_background"
    testID={testID}
  />
)
