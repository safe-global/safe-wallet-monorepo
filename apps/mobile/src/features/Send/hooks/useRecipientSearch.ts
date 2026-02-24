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
    const safeOptions: RecipientOption[] = Object.keys(allSafes)
      .filter((addr) => !sameAddress(addr, activeSafe.address))
      .map((addr) => ({
        address: addr,
        name: 'My Safe',
        section: 'safes' as const,
      }))

    const signerOptions: RecipientOption[] = Object.values(signersMap).map((s) => ({
      address: s.value,
      name: s.name ?? 'Signer',
      section: 'signers' as const,
    }))

    const contactOptions: RecipientOption[] = contacts
      .filter((c) => {
        if (c.chainIds.length === 0) {
          return true
        }
        return c.chainIds.includes(activeSafe.chainId)
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
