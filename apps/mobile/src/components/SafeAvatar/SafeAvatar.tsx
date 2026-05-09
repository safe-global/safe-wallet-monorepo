import React from 'react'
import { Avatar } from '@tamagui/avatar'
import type { AvatarProps } from '@tamagui/avatar'
import { View } from 'tamagui'

// Local loading status type
type LoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface SafeAvatarProps extends Omit<AvatarProps, 'children'> {
  /** The image URL to display */
  src: string
  /** Optional delay for showing the fallback (in ms) */
  delayMs?: number
  /** Background color for the fallback layer, e.g. '$gray4' */
  fallbackBackgroundColor?: string
  /** Optional content to render inside the fallback, e.g. an icon */
  fallbackIcon?: React.ReactNode
  /** The label for the avatar */
  label?: string
}

/**
 * Wrapper around the Tamagui Avatar component. Ads support for displaying the fallback when the image fails to load.
 *
 */
export function SafeAvatar({
  src,
  size = '$true',
  label,
  delayMs,
  fallbackBackgroundColor,
  fallbackIcon,
  circular = true,
  ...avatarProps
}: SafeAvatarProps) {
  const [status, setStatus] = React.useState<LoadingStatus>('idle')

  return (
    <Avatar size={size} {...avatarProps} circular={circular}>
      {/* Always render the image but hide on error so fallback is visible underneath */}
      {src && status !== 'error' && (
        <Avatar.Image
          src={src}
          onLoadingStatusChange={(st) => setStatus(st)}
          backgroundColor="$color"
          accessibilityLabel={label}
        />
      )}
      {/* Fallback shows until status becomes 'loaded' */}
      <Avatar.Fallback delayMs={delayMs} backgroundColor={fallbackBackgroundColor}>
        <View
          backgroundColor="$background"
          padding="$2"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          borderRadius={100}
          flex={1}
        >
          {fallbackIcon}
        </View>
      </Avatar.Fallback>
    </Avatar>
  )
}

SafeAvatar.displayName = 'SafeAvatar'
