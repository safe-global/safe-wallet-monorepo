import { Skeleton } from 'moti/skeleton'
import type { ComponentProps } from 'react'
import { useTheme } from '@/src/theme/hooks/useTheme'

type SafeSkeletonProps = Omit<ComponentProps<typeof Skeleton>, 'colorMode'>

/**
 * Thin wrapper around Moti's Skeleton that automatically syncs with the app theme.
 *
 * Moti only accepts 'light' | 'dark' for colorMode and defaults to 'dark'
 * when the value is unrecognized. This wrapper maps 'unspecified' to 'light'.
 */
export function SafeSkeleton(props: SafeSkeletonProps) {
  const { colorScheme } = useTheme()
  const colorMode = colorScheme === 'dark' ? 'dark' : 'light'

  return <Skeleton colorMode={colorMode} {...props} />
}

SafeSkeleton.Group = Skeleton.Group
