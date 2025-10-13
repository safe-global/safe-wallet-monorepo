import { DependencyList, EffectCallback, useEffect, useRef } from 'react'
import isEqual from 'lodash/isEqual'

/**
 * useEffect with deep equality comparison for dependencies
 * @param effect - Effect callback function
 * @param deps - Dependencies to compare deeply
 */
export function useEffectDeepCompare(effect: EffectCallback, deps: DependencyList) {
  const prevDepsRef = useRef<DependencyList>([])

  if (!isEqual(prevDepsRef.current, deps)) {
    prevDepsRef.current = deps
  }

  return useEffect(effect, [prevDepsRef.current])
}
