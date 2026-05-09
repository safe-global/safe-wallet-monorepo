import React from 'react'
import { Badge } from '@/src/components/Badge'
import { SafeSkeleton } from '@/src/components/SafeSkeleton'

interface ThresholdBadgeProps {
  threshold: number
  ownersCount: number
  size?: number
  fontSize?: number
  isLoading?: boolean
  testID?: string
}

export const ThresholdBadge = ({
  threshold,
  ownersCount,
  size = 28,
  fontSize = 12,
  isLoading = false,
  testID,
}: ThresholdBadgeProps) => {
  if (isLoading) {
    return <SafeSkeleton radius="round" height={size} width={size} />
  }

  const content = `${threshold}/${ownersCount}`

  return (
    <Badge
      content={content}
      textContentProps={{
        fontSize,
        fontWeight: 500,
      }}
      circleSize={size}
      themeName="badge_success_variant2"
      circleProps={{
        bordered: true,
        borderColor: '$colorContrast',
      }}
      testID={testID}
    />
  )
}
