import React from 'react'
import { View } from 'tamagui'

export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface BadgeWrapperProps {
  children: React.ReactNode
  badge?: React.ReactNode
  position?: BadgePosition
  offset?: number
  testID?: string
}

export const BadgeWrapper = ({ children, badge, position = 'top-right', offset = 5, testID }: BadgeWrapperProps) => {
  if (!badge) {
    return <>{children}</>
  }

  const getBadgePositionProps = (position: BadgePosition, offset: number) => {
    const offsetValue = -offset

    switch (position) {
      case 'top-left':
        return { top: offsetValue, left: offsetValue }
      case 'top-right':
        return { top: offsetValue, right: offsetValue }
      case 'bottom-left':
        return { bottom: offsetValue, left: offsetValue }
      case 'bottom-right':
        return { bottom: offsetValue, right: offsetValue }
      default:
        return { top: offsetValue, right: offsetValue }
    }
  }

  return (
    <View position="relative" testID={testID}>
      {children}
      <View position="absolute" zIndex={1} {...getBadgePositionProps(position, offset)}>
        {badge}
      </View>
    </View>
  )
}
