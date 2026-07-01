import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAddress } from 'ethers'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useAddressSimilarity from './useAddressSimilarity'
import { splitAddress, type AddressParts } from '../utils/splitAddress'

export type GuardLevel = 'none' | 'warn' | 'critical'
export type GuardContext = 'recipient' | 'add-entity'
type GuardPath = 'different' | null
export type GuardResolution = { kind: 'trusted' | 'warn-override' | 'critical-override' }

export type AddressPoisoningGuardOptions = {
  /** The entered/candidate address (already extracted + validated by the host). */
  address?: string
  /** Swap the field to the trusted anchor address (recipient flows only). */
  onUseTrusted?: (trusted: string) => void
  /** Does a one-end (amber) match also block, or only warn? Default true. */
  amberBlocks?: boolean
  /** For a both-ends (red) match, force middle re-entry vs. just an attestation. Default true. */
  requireReentry?: boolean
  /** 'recipient' offers the trusted-swap; 'add-entity' (new owner/contact/…) does not. */
  context?: GuardContext
}

export type AddressPoisoningGuard = {
  level: GuardLevel
  match: SimilarityMatch | null
  /** Full trusted address (`0x…`) the candidate resembles, or undefined. */
  anchorAddress?: string
  parts: AddressParts
  /** Block the host's continue/sign/confirm button while true. */
  isBlocked: boolean
  /** Non-null once the user has resolved the warning; drives the resolved chip. */
  resolved: GuardResolution | null
  usingTrusted: boolean
  allowTrusted: boolean
  // verification sub-state
  expanded: boolean
  path: GuardPath
  mid: string
  ack: boolean
  midMatch: boolean
  // handlers
  expand: () => void
  useTrusted: () => void
  chooseDifferent: () => void
  setMid: (value: string) => void
  toggleAck: () => void
  compareAgain: () => void
}

/**
 * Reusable address-poisoning guard for any address-entry field. Compares the
 * entered address against the user's trusted anchors and, by default, BLOCKS the
 * host's action button until the user resolves the warning — either by swapping to
 * the trusted address-book entry (recipient flows) or, for a genuinely new address,
 * re-typing only the middle of it (red) / attesting (amber). Resolution is always a
 * deliberate, high-friction path; there is no one-click "proceed anyway".
 */
const useAddressPoisoningGuard = ({
  address,
  onUseTrusted,
  amberBlocks = true,
  requireReentry = true,
  context = 'recipient',
}: AddressPoisoningGuardOptions): AddressPoisoningGuard => {
  const match = useAddressSimilarity(address)
  const [expanded, setExpanded] = useState(false)
  const [path, setPath] = useState<GuardPath>(null)
  const [mid, setMidState] = useState('')
  const [ack, setAck] = useState(false)
  const [swappedTo, setSwappedTo] = useState<string | null>(null)

  // A new candidate must be verified afresh (the trusted-swap state survives, so a
  // post-swap clean address can still show the green confirmation).
  useEffect(() => {
    setExpanded(false)
    setPath(null)
    setMidState('')
    setAck(false)
  }, [address, match?.anchor])

  const parts = useMemo(() => splitAddress(address ?? ''), [address])
  // Checksum the anchor: the address book (and useAddressResolver) is keyed by the
  // EIP-55 form, so the lowercase engine output would miss the contact-name lookup.
  const anchorAddress = useMemo(() => {
    if (!match?.anchor) return undefined
    const raw = `0x${match.anchor}`
    try {
      return getAddress(raw)
    } catch {
      return raw
    }
  }, [match?.anchor])
  const allowTrusted = context === 'recipient'
  const usingTrusted = !!swappedTo && !!address && sameAddress(address, swappedTo)
  const midMatch = mid.trim().length > 0 && mid.trim().toLowerCase() === parts.middle.toLowerCase()

  const level: GuardLevel = !match ? 'none' : match.severity === Severity.CRITICAL ? 'critical' : 'warn'

  let isBlocked = false
  let resolved: GuardResolution | null = null

  if (usingTrusted) {
    resolved = { kind: 'trusted' }
  } else if (level === 'warn') {
    if (ack) resolved = { kind: 'warn-override' }
    isBlocked = amberBlocks ? !ack : false
  } else if (level === 'critical') {
    const overridden = path === 'different' && (requireReentry ? midMatch && ack : ack)
    if (overridden) resolved = { kind: 'critical-override' }
    isBlocked = !overridden
  }

  const expand = useCallback(() => setExpanded(true), [])
  const chooseDifferent = useCallback(() => setPath('different'), [])
  const setMid = useCallback((value: string) => setMidState(value), [])
  const toggleAck = useCallback(() => setAck((prev) => !prev), [])
  const useTrusted = useCallback(() => {
    if (!anchorAddress) return
    setSwappedTo(anchorAddress)
    onUseTrusted?.(anchorAddress)
  }, [anchorAddress, onUseTrusted])
  const compareAgain = useCallback(() => {
    setExpanded(true)
    setPath(null)
    setMidState('')
    setAck(false)
  }, [])

  return {
    level,
    match,
    anchorAddress,
    parts,
    isBlocked,
    resolved,
    usingTrusted,
    allowTrusted,
    expanded,
    path,
    mid,
    ack,
    midMatch,
    expand,
    useTrusted,
    chooseDifferent,
    setMid,
    toggleAck,
    compareAgain,
  }
}

export default useAddressPoisoningGuard
