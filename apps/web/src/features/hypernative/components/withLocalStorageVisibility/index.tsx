import type { ComponentType, ReactElement } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

/**
 * Higher-order component that checks localStorage to determine if a component should be rendered.
 * Only renders the wrapped component if the localStorage value meets the condition.
 *
 * @param localStorageKey - The key to check in localStorage
 * @param shouldShow - Function that determines if component should be shown based on localStorage value
 */
export function withLocalStorageVisibility<P extends object>(
  localStorageKey: string,
  shouldShow: (value: boolean | undefined) => boolean = (value) => value !== false,
) {
  return function (WrappedComponent: ComponentType<P>) {
    return function WithLocalStorageVisibilityComponent(props: P): ReactElement | null {
      const [value] = useLocalStorage<boolean>(localStorageKey)

      if (!shouldShow(value)) {
        return null
      }

      return <WrappedComponent {...props} />
    }
  }
}
