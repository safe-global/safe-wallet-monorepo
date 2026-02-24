import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectAddressBookState, type Contact } from '@/src/store/addressBookSlice'
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

  const result = useMemo((): RecipientValidationResult => {
    const trimmed = address.trim()

    if (!trimmed) {
      return { state: 'empty', isValid: false, canContinue: false }
    }

    if (trimmed.length < 42) {
      return { state: 'typing', isValid: false, canContinue: false }
    }

    if (!isAddress(trimmed)) {
      return { state: 'invalid', isValid: false, canContinue: false }
    }

    // Self-send warning
    if (sameAddress(trimmed, activeSafe.address)) {
      return { state: 'self-send', isValid: true, canContinue: true }
    }

    // 3-step address book lookup (exact → lowercase → sameAddress scan)
    let contact: Contact | undefined
    contact = addressBookState.contacts[trimmed]
    if (!contact) {
      contact = addressBookState.contacts[trimmed.toLowerCase()]
    }
    if (!contact) {
      const allContacts = Object.values(addressBookState.contacts)
      contact = allContacts.find((c) => sameAddress(c.value, trimmed))
    }

    if (contact) {
      const isChainScoped = contact.chainIds.length === 0 || contact.chainIds.includes(activeSafe.chainId)
      if (isChainScoped) {
        return {
          state: 'known',
          contactName: contact.name,
          isValid: true,
          canContinue: true,
        }
      }
    }

    // Check signers
    const signer = Object.values(signers).find((s) => sameAddress(s.value, trimmed))
    if (signer) {
      return {
        state: 'known',
        contactName: signer.name ?? 'Signer',
        isValid: true,
        canContinue: true,
      }
    }

    // Check own safes
    const ownSafe = Object.keys(allSafes).find((safeAddr) => sameAddress(safeAddr, trimmed))
    if (ownSafe) {
      return {
        state: 'known',
        contactName: 'My Safe',
        isValid: true,
        canContinue: true,
      }
    }

    return { state: 'unknown', isValid: true, canContinue: true }
  }, [address, activeSafe, addressBookState.contacts, signers, allSafes])

  return result
}
