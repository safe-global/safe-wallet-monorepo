import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import useListSimilarities from './useListSimilarities'

export const SIMILARITY_WARNING_TOOLTIP =
  'This address closely resembles an address you trust. Verify the full address before relying on it.'

/**
 * Mode B convenience wrapper: given a list of addresses, returns a getter that yields
 * the address-poisoning warning tooltip for any address resembling a trusted anchor
 * (and `undefined` otherwise). Drop the getter into a list's EthHashInfo
 * `similarityWarning` prop. Lookup is normalized, so the getter tolerates any casing.
 *
 * Pass a referentially-stable `addresses` array (memoize at the call site) so the
 * underlying detection is not recomputed on every render.
 */
const useListSimilarityWarnings = (addresses: string[]): ((address?: string) => ReactNode | undefined) => {
  const annotations = useListSimilarities(addresses)

  const matched = useMemo(() => {
    const set = new Set<string>()
    annotations.forEach((annotation) => {
      if (annotation.match) set.add(normalizeAddress(annotation.address))
    })
    return set
  }, [annotations])

  return useMemo(
    () => (address?: string) =>
      address && matched.has(normalizeAddress(address)) ? SIMILARITY_WARNING_TOOLTIP : undefined,
    [matched],
  )
}

export default useListSimilarityWarnings
