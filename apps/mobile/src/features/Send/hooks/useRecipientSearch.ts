import { useMemo } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectAllContacts } from '@/src/store/addressBookSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectAllSafes, SafesSlice } from '@/src/store/safesSlice'

export interface RecipientOption {
  address: string
  name: string
  section: 'safes' | 'signers' | 'addressBook'
}

function buildAllContactNames(contacts: { value: string; name: string }[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of contacts) {
    map.set(c.value.toLowerCase(), c.name)
  }
  return map
}

function buildChainFilteredContactNames(
  contacts: { chainIds: string[]; value: string; name: string }[],
  chainId: string,
): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of contacts) {
    if (c.chainIds.length === 0 || c.chainIds.includes(chainId)) {
      map.set(c.value.toLowerCase(), c.name)
    }
  }
  return map
}

function buildSafeOptions(
  allSafes: SafesSlice,
  chainId: string,
  namesByAddress: Map<string, string>,
): RecipientOption[] {
  return Object.entries(allSafes)
    .filter(([, chainMap]) => chainId in chainMap)
    .map(([addr]) => ({
      address: addr,
      name: namesByAddress.get(addr.toLowerCase()) ?? 'My Safe',
      section: 'safes' as const,
    }))
}

function buildSignerOptions(
  signersMap: Record<string, { value: string; name?: string | null }>,
  excludeAddresses: Set<string>,
  contactsByAddress: Map<string, string>,
): RecipientOption[] {
  return Object.values(signersMap)
    .filter((s) => !excludeAddresses.has(s.value.toLowerCase()))
    .map((s) => ({
      address: s.value,
      name: contactsByAddress.get(s.value.toLowerCase()) ?? s.name ?? 'Signer',
      section: 'signers' as const,
    }))
}

function buildContactOptions(
  contacts: { chainIds: string[]; value: string; name: string }[],
  chainId: string,
  excludeAddresses: Set<string>,
): RecipientOption[] {
  return contacts
    .filter((c) => {
      if (c.chainIds.length > 0 && !c.chainIds.includes(chainId)) {
        return false
      }
      return !excludeAddresses.has(c.value.toLowerCase())
    })
    .map((c) => ({
      address: c.value,
      name: c.name,
      section: 'addressBook' as const,
    }))
}

export function useRecipientSearch(query: string): {
  safes: RecipientOption[]
  signers: RecipientOption[]
  addressBook: RecipientOption[]
} {
  const activeSafe = useDefinedActiveSafe()
  const contacts = useAppSelector(selectAllContacts)
  const signersMap = useAppSelector(selectSigners)
  const allSafes = useAppSelector(selectAllSafes)

  const allOptions = useMemo(() => {
    const namesByAddress = buildAllContactNames(contacts)
    const contactsByAddress = buildChainFilteredContactNames(contacts, activeSafe.chainId)
    const safeOptions = buildSafeOptions(allSafes, activeSafe.chainId, namesByAddress)

    // Exclude Safes shown in "My Safe accounts" + the active Safe from other sections
    const shownSafeAddresses = new Set(safeOptions.map((s) => s.address.toLowerCase()))
    shownSafeAddresses.add(activeSafe.address.toLowerCase())
    const signerOptions = buildSignerOptions(signersMap, shownSafeAddresses, contactsByAddress)

    const signerAddresses = new Set(signerOptions.map((s) => s.address.toLowerCase()))
    const allExcluded = new Set([...shownSafeAddresses, ...signerAddresses])
    const contactOptions = buildContactOptions(contacts, activeSafe.chainId, allExcluded)

    return { safeOptions, signerOptions, contactOptions }
  }, [allSafes, activeSafe.address, activeSafe.chainId, signersMap, contacts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return {
        safes: allOptions.safeOptions,
        signers: allOptions.signerOptions,
        addressBook: allOptions.contactOptions,
      }
    }

    const filter = (options: RecipientOption[]) =>
      options.filter((opt) => opt.address.toLowerCase().includes(q) || opt.name.toLowerCase().includes(q))

    return {
      safes: filter(allOptions.safeOptions),
      signers: filter(allOptions.signerOptions),
      addressBook: filter(allOptions.contactOptions),
    }
  }, [query, allOptions])

  return filtered
}
