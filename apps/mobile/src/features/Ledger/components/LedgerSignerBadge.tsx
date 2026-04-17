import React from 'react'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface LedgerSignerBadgeProps {
  size?: number
  fontSize?: number
  testID?: string
}

export const LedgerSignerBadge = ({ size = 24, fontSize = 10, testID }: LedgerSignerBadgeProps) => (
  <Badge
    content={<SafeFontIcon name="hardware" size={12} color="$color" />}
    textContentProps={{
      fontSize,
      fontWeight: 500,
    }}
    circleSize={size}
    themeName="badge_background"
    testID={testID}
  />
)
