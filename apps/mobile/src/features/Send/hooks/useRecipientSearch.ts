import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectAllContacts } from '@/src/store/addressBookSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectAllSafes } from '@/src/store/safesSlice'

export interface RecipientOption {
  address: string
  name: string
  section: 'safes' | 'signers' | 'addressBook'
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
    // Build a lookup of address book names so safes/signers
    // can display their contact name when available.
    const contactsByAddress = new Map<string, string>()
    for (const c of contacts) {
      if (c.chainIds.length === 0 || c.chainIds.includes(activeSafe.chainId)) {
        contactsByAddress.set(c.value.toLowerCase(), c.name)
      }
    }

    const safeOptions: RecipientOption[] = Object.keys(allSafes)
      .filter((addr) => !sameAddress(addr, activeSafe.address))
      .map((addr) => ({
        address: addr,
        name: contactsByAddress.get(addr.toLowerCase()) ?? 'My Safe',
        section: 'safes' as const,
      }))

    // Deduplicate: exclude addresses already shown in safes
    const safeAddresses = new Set(safeOptions.map((s) => s.address.toLowerCase()))

    const signerOptions: RecipientOption[] = Object.values(signersMap)
      .filter((s) => !safeAddresses.has(s.value.toLowerCase()))
      .map((s) => ({
        address: s.value,
        name: contactsByAddress.get(s.value.toLowerCase()) ?? s.name ?? 'Signer',
        section: 'signers' as const,
      }))

    // Deduplicate: exclude addresses already shown in safes or signers
    const signerAddresses = new Set(signerOptions.map((s) => s.address.toLowerCase()))

    const contactOptions: RecipientOption[] = contacts
      .filter((c) => {
        if (c.chainIds.length > 0 && !c.chainIds.includes(activeSafe.chainId)) {
          return false
        }
        const lower = c.value.toLowerCase()
        return !safeAddresses.has(lower) && !signerAddresses.has(lower)
      })
      .map((c) => ({
        address: c.value,
        name: c.name,
        section: 'addressBook' as const,
      }))

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
