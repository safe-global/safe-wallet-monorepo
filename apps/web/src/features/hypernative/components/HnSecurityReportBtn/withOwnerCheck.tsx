import type { ComponentType, ReactElement } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'

/**
 * Higher-order component that checks if the current user is an owner of the Safe.
 * Returns null if the user is not an owner.
 *
 * This HoC should be applied before expensive checks (like withGuardCheck)
 * to avoid unnecessary hook calls when the user is not an owner.
 */
export function withOwnerCheck<P extends object>(WrappedComponent: ComponentType<P>) {
  return function WithOwnerCheckComponent(props: P): ReactElement | null {
    const isOwner = useIsSafeOwner()

    if (!isOwner) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
