import { type DependencyList, useRef } from 'react'
import isEqual from 'lodash/isEqual'
import useAsync from '@safe-global/utils/hooks/useAsync'

/**
 * useAsync with deep equality comparison for dependencies
 * @param asyncFn - Async function to execute
 * @param deps - Dependencies to compare deeply
 * @returns Result from useAsync hook [data, error, loading]
 */
export function useAsyncDeepCompare<T>(asyncFn: () => Promise<T>, deps: DependencyList) {
  const prevDepsRef = useRef<DependencyList>([])

  if (!isEqual(prevDepsRef.current, deps)) {
    prevDepsRef.current = deps
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useAsync(asyncFn, [prevDepsRef.current])
}
