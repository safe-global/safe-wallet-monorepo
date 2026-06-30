import { useMemo } from 'react'
import useListSimilarities from './useListSimilarities'

/**
 * Mode B convenience wrapper for list components that already accept a
 * `Set<string>` of lowercased flagged addresses (e.g. `SafeCardReadOnly`'s
 * `isSimilar` pattern). Returns the lowercased addresses in `addresses` that
 * resemble a trusted anchor.
 *
 * Pass a referentially-stable `addresses` array (memoize at the call site).
 */
const useSimilarAddressSet = (addresses: string[]): Set<string> => {
  const annotations = useListSimilarities(addresses)

  return useMemo(() => {
    const set = new Set<string>()
    annotations.forEach((annotation) => {
      if (annotation.match) set.add(annotation.address.toLowerCase())
    })
    return set
  }, [annotations])
}

export default useSimilarAddressSet
