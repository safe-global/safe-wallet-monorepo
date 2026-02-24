import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAddressBookCheck } from '@safe-global/utils/features/safe-shield/hooks/address-analysis/address-book-check/useAddressBookCheck'
import { RecipientStatus } from '@safe-global/utils/features/safe-shield/types'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectAddressBookState } from '@/src/store/addressBookSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectAllSafes } from '@/src/store/safesSlice'

export type RecipientValidationState = 'empty' | 'typing' | 'known' | 'unknown' | 'invalid' | 'self-send'

export interface RecipientValidationResult {
  state: RecipientValidationState
  contactName?: string
  isValid: boolean
  canContinue: boolean
}

export function useRecipientValidation(address: string): RecipientValidationResult {
  const activeSafe = useDefinedActiveSafe()
  const addressBookState = useAppSelector(selectAddressBookState)
  const signers = useAppSelector(selectSigners)
  const allSafes = useAppSelector(selectAllSafes)

  // Reuse SafeShield's isInAddressBook pattern (same as mobile useCounterpartyAnalysis)
  const isInAddressBook = useMemo(() => {
    return (addr: string, checkChainId: string): boolean => {
      const contact =
        addressBookState.contacts[addr] ??
        addressBookState.contacts[addr.toLowerCase()] ??
        Object.values(addressBookState.contacts).find((c) => sameAddress(c.value, addr))
      if (!contact) {
        return false
      }
      if (contact.chainIds.length === 0) {
        return true
      }
      return contact.chainIds.includes(checkChainId)
    }
  }, [addressBookState.contacts])

  const ownedSafes = useMemo(() => Object.keys(allSafes), [allSafes])

  const trimmed = address.trim()
  const isValidAddress = trimmed.length >= 42 && isAddress(trimmed)
  const addresses = useMemo(() => (isValidAddress ? [trimmed] : []), [isValidAddress, trimmed])

  // SafeShield address book + owned safe check
  const addressBookCheck = useAddressBookCheck(activeSafe.chainId, addresses, isInAddressBook, ownedSafes)

  const result = useMemo((): RecipientValidationResult => {
    if (!trimmed) {
      return { state: 'empty', isValid: false, canContinue: false }
    }

    if (trimmed.length < 42) {
      return { state: 'typing', isValid: false, canContinue: false }
    }

    if (!isAddress(trimmed)) {
      return { state: 'invalid', isValid: false, canContinue: false }
    }

    if (sameAddress(trimmed, activeSafe.address)) {
      return { state: 'self-send', isValid: true, canContinue: true }
    }

    // Use SafeShield result for address book + owned safe checks
    const shieldResult = addressBookCheck?.[trimmed]
    if (shieldResult?.type === RecipientStatus.KNOWN_RECIPIENT) {
      // Resolve a display name from the address book
      let contactName: string | undefined
      const contact =
        addressBookState.contacts[trimmed] ??
        addressBookState.contacts[trimmed.toLowerCase()] ??
        Object.values(addressBookState.contacts).find((c) => sameAddress(c.value, trimmed))

      if (contact) {
        contactName = contact.name
      } else {
        contactName = 'My Safe'
      }

      return { state: 'known', contactName, isValid: true, canContinue: true }
    }

    // Signer check (not covered by SafeShield)
    const signer = Object.values(signers).find((s) => sameAddress(s.value, trimmed))
    if (signer) {
      return {
        state: 'known',
        contactName: signer.name ?? 'Signer',
        isValid: true,
        canContinue: true,
      }
    }

    return { state: 'unknown', isValid: true, canContinue: true }
  }, [trimmed, activeSafe.address, addressBookCheck, addressBookState.contacts, signers])

  return result
}
