import { useEffect, useState } from 'react'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import useAddressSimilarity from './useAddressSimilarity'

export type AddressSimilarityGate = {
  /** The strongest anchor the address resembles, or null. */
  match: SimilarityMatch | null
  /** True while a CRITICAL (both-ends) match is unacknowledged — block submission. */
  isBlocked: boolean
  /** Whether the user has acknowledged the CRITICAL match. */
  acknowledged: boolean
  /** Acknowledge the current CRITICAL match (after comparing full addresses). */
  acknowledge: () => void
}

/**
 * Gate for a write flow (e.g. add-owner): surfaces an address-similarity match and,
 * for a CRITICAL (both-ends) lookalike, blocks submission until the user explicitly
 * acknowledges. A one-end (WARN) match is surfaced but never blocks. The acknowledgement
 * resets whenever the address changes, so each candidate is gated independently.
 */
const useAddressSimilarityGate = (address?: string): AddressSimilarityGate => {
  const match = useAddressSimilarity(address)
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    setAcknowledged(false)
  }, [address, match?.anchor])

  const isBlocked = match?.severity === Severity.CRITICAL && !acknowledged

  return { match, isBlocked, acknowledged, acknowledge: () => setAcknowledged(true) }
}

export default useAddressSimilarityGate
