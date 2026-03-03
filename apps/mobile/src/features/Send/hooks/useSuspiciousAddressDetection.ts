import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectAllContacts } from '@/src/store/addressBookSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectAllSafes } from '@/src/store/safesSlice'

export interface SuspiciousAddressMatch {
  knownAddress: string
  knownName: string
}

export interface SuspiciousDetectionResult {
  isSuspicious: boolean
  match: SuspiciousAddressMatch | undefined
}

const EMPTY_RESULT: SuspiciousDetectionResult = {
  isSuspicious: false,
  match: undefined,
}

function resolveAddressName(
  address: string,
  contactLookup: Map<string, string>,
  signerLookup: Map<string, string>,
  safeLookup: Set<string>,
): string {
  const lower = address.toLowerCase()
  return contactLookup.get(lower) ?? signerLookup.get(lower) ?? (safeLookup.has(lower) ? 'My Safe' : 'Unknown')
}

export function useSuspiciousAddressDetection(address: string): SuspiciousDetectionResult {
  const activeSafe = useDefinedActiveSafe()
  const contacts = useAppSelector(selectAllContacts)
  const signersMap = useAppSelector(selectSigners)
  const allSafes = useAppSelector(selectAllSafes)

  return useMemo(() => {
    const trimmed = address.trim()
    if (!trimmed || trimmed.length < 42 || !isAddress(trimmed)) {
      return EMPTY_RESULT
    }

    // Include ALL contacts regardless of chain - address poisoning
    // is a visual attack that's chain-agnostic
    const contactLookup = new Map<string, string>()
    for (const c of contacts) {
      contactLookup.set(c.value.toLowerCase(), c.name)
    }

    const signerLookup = new Map<string, string>()
    for (const s of Object.values(signersMap)) {
      signerLookup.set(s.value.toLowerCase(), s.name ?? 'Signer')
    }

    const safeAddresses = new Set(Object.keys(allSafes).map((a) => a.toLowerCase()))

    // Collect all known addresses including the active safe -
    // someone could poison an address similar to the active safe
    const knownAddresses = new Set<string>()
    for (const addr of contactLookup.keys()) {
      knownAddresses.add(addr)
    }
    for (const addr of signerLookup.keys()) {
      knownAddresses.add(addr)
    }
    for (const addr of safeAddresses) {
      knownAddresses.add(addr)
    }

    // If the input is itself a known address, skip detection
    const inputLower = trimmed.toLowerCase()
    if (knownAddresses.has(inputLower)) {
      return EMPTY_RESULT
    }

    if (knownAddresses.size === 0) {
      return EMPTY_RESULT
    }

    const allAddresses = [inputLower, ...knownAddresses]
    const result = detectSimilarAddresses(allAddresses)

    if (!result.isFlagged(inputLower)) {
      return EMPTY_RESULT
    }

    const group = result.getGroup(inputLower)
    const matchAddress = group?.addresses.find((addr) => addr !== inputLower)

    if (!matchAddress) {
      return EMPTY_RESULT
    }

    return {
      isSuspicious: true,
      match: {
        knownAddress: matchAddress,
        knownName: resolveAddressName(matchAddress, contactLookup, signerLookup, safeAddresses),
      },
    }
  }, [address, activeSafe.address, contacts, signersMap, allSafes])
}
