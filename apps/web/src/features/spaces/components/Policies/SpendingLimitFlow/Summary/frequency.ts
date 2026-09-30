import { getResetTimeOptions } from '@/features/spending-limits/constants'
import { CANONICAL_FREQUENCIES } from './constants'

type FrequencyDescription = {
  /** Row label: `Weekly`, or the dropdown's own label (`30 minutes`) for a non-canonical period. */
  label: string
  /** Callout adjective (`weekly`); undefined for a non-canonical period. */
  adjective?: string
}

/** A test-chain period has no designed wording, so it reuses the label the form's dropdown showed. */
export const describeFrequency = (resetTimeMin: string, chainId: string): FrequencyDescription => {
  const canonical = CANONICAL_FREQUENCIES[resetTimeMin]
  if (canonical) return { label: canonical.label, adjective: canonical.adjective }

  const option = getResetTimeOptions(chainId).find((candidate) => candidate.value === resetTimeMin)
  return { label: option?.label ?? `${resetTimeMin} minutes` }
}
