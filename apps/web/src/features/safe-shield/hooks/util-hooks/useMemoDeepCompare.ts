import { DependencyList, useMemo, useRef } from 'react'
import isEqual from 'lodash/isEqual'

/**
 * useMemo with deep equality comparison for dependencies
 * @param memoFn - Function to memoize
 * @param deps - Dependencies to compare deeply
 * @returns Memoized value
 */
export function useMemoDeepCompare<T>(memoFn: () => T, deps: DependencyList): T {
  const prevDepsRef = useRef<DependencyList>([])

  if (!isEqual(prevDepsRef.current, deps)) {
    prevDepsRef.current = deps
  }

  return useMemo(memoFn, [prevDepsRef.current])
}
