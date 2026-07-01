import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAddress } from 'ethers'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useAddressSimilarity from './useAddressSimilarity'
import { splitAddress, type AddressParts } from '../utils/splitAddress'

export type GuardLevel = 'none' | 'warn' | 'critical'
export type GuardContext = 'recipient' | 'add-entity'

/** The short cue shown next to the host's primary action button while it is blocked. */
export type BlockedHint = { text: string; tone: 'warn' | 'critical' }

export type AddressPoisoningGuardOptions = {
  /** The entered/candidate address (already extracted + validated by the host). */
  address?: string
  /** Write an address back into the field: the trusted swap, or the restore-on-undo. */
  onUseTrusted?: (address: string) => void
  /** Does a one-end (amber) match also block, or only warn? Default true. */
  amberBlocks?: boolean
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
  /** Copy for the button-side cue while blocked (empty when the guard is inactive). */
  blockedHint: string
  /** True once the field has been swapped to the trusted anchor (drives the green chip). */
  usingTrusted: boolean
  allowTrusted: boolean
  /** The attestation checkbox — ticking it alone unblocks; the warning stays visible. */
  ack: boolean
  useTrusted: () => void
  undoTrusted: () => void
  toggleAck: () => void
}

/**
 * Reusable address-poisoning guard for any address-entry field. Compares the entered
 * address against the user's trusted anchors and, by default, BLOCKS the host's action
 * button until the user resolves the warning in one deliberate step: either swap to the
 * trusted address-book entry (recipient flows) or tick the attestation. Ticking the
 * attestation only unblocks — the warning stays in place (no swap to a "resolved" chip);
 * only the trusted swap removes the guard (with an undo). There is no one-click "proceed".
 */
const useAddressPoisoningGuard = ({
  address,
  onUseTrusted,
  amberBlocks = true,
  context = 'recipient',
}: AddressPoisoningGuardOptions): AddressPoisoningGuard => {
  const match = useAddressSimilarity(address)
  const [ack, setAck] = useState(false)
  const [swappedTo, setSwappedTo] = useState<string | null>(null)
  const [swappedFrom, setSwappedFrom] = useState<string | null>(null)

  // A new candidate must be acknowledged afresh (the trusted-swap survives so a
  // post-swap clean address still shows the green confirmation).
  useEffect(() => {
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
  const level: GuardLevel = !match ? 'none' : match.severity === Severity.CRITICAL ? 'critical' : 'warn'

  const resolved = usingTrusted || ack
  const isBlocked = level === 'none' ? false : level === 'warn' ? (amberBlocks ? !resolved : false) : !resolved

  // The button-side cue: critical recipient flows ask to verify the recipient, critical
  // add-entity flows the address, amber flows just to confirm. Empty when inactive.
  const blockedHint = useMemo(() => {
    if (level === 'none') return ''
    if (level === 'critical')
      return allowTrusted ? 'Verify the recipient to continue' : 'Verify the address to continue'
    return 'Confirm the address to continue'
  }, [level, allowTrusted])

  const toggleAck = useCallback(() => setAck((prev) => !prev), [])
  const useTrusted = useCallback(() => {
    if (!anchorAddress) return
    setSwappedFrom(address ?? null)
    setSwappedTo(anchorAddress)
    onUseTrusted?.(anchorAddress)
  }, [anchorAddress, onUseTrusted, address])
  const undoTrusted = useCallback(() => {
    setSwappedTo(null)
    if (swappedFrom != null) onUseTrusted?.(swappedFrom)
  }, [onUseTrusted, swappedFrom])

  return {
    level,
    match,
    anchorAddress,
    parts,
    isBlocked,
    blockedHint,
    usingTrusted,
    allowTrusted,
    ack,
    useTrusted,
    undoTrusted,
    toggleAck,
  }
}

export default useAddressPoisoningGuard
