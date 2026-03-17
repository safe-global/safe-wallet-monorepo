import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAddressBookCheck } from '@safe-global/utils/features/safe-shield/hooks/address-analysis/address-book-check/useAddressBookCheck'
import { RecipientStatus } from '@safe-global/utils/features/safe-shield/types'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { type Contact, selectAddressBookState } from '@/src/store/addressBookSlice'
import { selectSigners } from '@/src/store/signersSlice'
import { selectAllSafes } from '@/src/store/safesSlice'
import { useSuspiciousAddressDetection, type SuspiciousAddressMatch } from './useSuspiciousAddressDetection'

export type RecipientValidationState =
  | 'empty'
  | 'typing'
  | 'known'
  | 'unknown'
  | 'invalid'
  | 'self-send'
  | 'suspicious'
  | 'known-other-chain'

export interface RecipientValidationResult {
  state: RecipientValidationState
  contactName?: string
  contactAddress?: string
  isValid: boolean
  canContinue: boolean
  suspiciousMatch?: SuspiciousAddressMatch
}

function findContact(contacts: Record<string, Contact>, addr: string): Contact | undefined {
  return (
    contacts[addr] ?? contacts[addr.toLowerCase()] ?? Object.values(contacts).find((c) => sameAddress(c.value, addr))
  )
}

function resolveContactName(contacts: Record<string, Contact>, addr: string): string {
  const contact = findContact(contacts, addr)
  return contact ? contact.name : 'My Safe'
}

function resolveSignerName(
  signers: Record<string, { name?: string | null; value: string }>,
  addr: string,
): string | undefined {
  const signer = Object.values(signers).find((s) => sameAddress(s.value, addr))
  return signer ? (signer.name ?? 'Signer') : undefined
}

interface AddressContext {
  activeSafeAddress: string
  addressBookCheck: Record<string, { type: string }> | undefined
  contacts: Record<string, Contact>
  signers: Record<string, { name?: string | null; value: string }>
}

function resolveIncompleteAddress(trimmed: string): RecipientValidationResult | undefined {
  if (!trimmed) {
    return { state: 'empty', isValid: false, canContinue: false }
  }

  if (trimmed.length < 42 || !isAddress(trimmed)) {
    const state = trimmed.length < 42 ? 'typing' : 'invalid'
    return { state, isValid: false, canContinue: false }
  }

  return undefined
}

function resolveKnownAddress(trimmed: string, ctx: AddressContext): RecipientValidationResult | undefined {
  if (sameAddress(trimmed, ctx.activeSafeAddress)) {
    return { state: 'self-send', isValid: true, canContinue: true }
  }

  const shieldResult = ctx.addressBookCheck?.[trimmed]
  if (shieldResult?.type === RecipientStatus.KNOWN_RECIPIENT) {
    const contactName = resolveContactName(ctx.contacts, trimmed)
    return { state: 'known', contactName, isValid: true, canContinue: true }
  }

  const signerName = resolveSignerName(ctx.signers, trimmed)
  if (signerName) {
    return { state: 'known', contactName: signerName, isValid: true, canContinue: true }
  }

  return undefined
}

const UNKNOWN_RESULT: RecipientValidationResult = {
  state: 'unknown',
  isValid: true,
  canContinue: true,
}

function resolveCrossChainContact(
  trimmed: string,
  contacts: Record<string, Contact>,
  chainId: string,
): { contactName: string; contactAddress: string } | undefined {
  const contact = findContact(contacts, trimmed)
  if (!contact) {
    return undefined
  }
  if (contact.chainIds.length === 0) {
    return undefined
  }
  if (contact.chainIds.includes(chainId)) {
    return undefined
  }
  return { contactName: contact.name, contactAddress: contact.value }
}

function resolveAddressState(trimmed: string, ctx: AddressContext): RecipientValidationResult {
  return resolveIncompleteAddress(trimmed) ?? resolveKnownAddress(trimmed, ctx) ?? UNKNOWN_RESULT
}

export function useRecipientValidation(address: string): RecipientValidationResult {
  const activeSafe = useDefinedActiveSafe()
  const addressBookState = useAppSelector(selectAddressBookState)
  const signers = useAppSelector(selectSigners)
  const allSafes = useAppSelector(selectAllSafes)

  const isInAddressBook = useMemo(() => {
    return (addr: string, checkChainId: string): boolean => {
      const contact = findContact(addressBookState.contacts, addr)
      if (!contact) {
        return false
      }
      return contact.chainIds.length === 0 || contact.chainIds.includes(checkChainId)
    }
  }, [addressBookState.contacts])

  const ownedSafes = useMemo(
    () =>
      Object.entries(allSafes)
        .filter(([, chainMap]) => activeSafe.chainId in chainMap)
        .map(([addr]) => addr),
    [allSafes, activeSafe.chainId],
  )

  const trimmed = address.trim()
  const isValidAddress = trimmed.length >= 42 && isAddress(trimmed)
  const addresses = useMemo(() => (isValidAddress ? [trimmed] : []), [isValidAddress, trimmed])

  const addressBookCheck = useAddressBookCheck(activeSafe.chainId, addresses, isInAddressBook, ownedSafes)
  const suspiciousDetection = useSuspiciousAddressDetection(address)

  const result = useMemo((): RecipientValidationResult => {
    const baseResult = resolveAddressState(trimmed, {
      activeSafeAddress: activeSafe.address,
      addressBookCheck,
      contacts: addressBookState.contacts,
      signers,
    })

    if (baseResult.state === 'unknown') {
      const crossChain = resolveCrossChainContact(trimmed, addressBookState.contacts, activeSafe.chainId)
      if (crossChain) {
        return {
          state: 'known-other-chain',
          contactName: crossChain.contactName,
          contactAddress: crossChain.contactAddress,
          isValid: true,
          canContinue: true,
        }
      }

      if (suspiciousDetection.isSuspicious) {
        return {
          ...baseResult,
          state: 'suspicious',
          canContinue: false,
          suspiciousMatch: suspiciousDetection.match,
        }
      }
    }

    return baseResult
  }, [
    trimmed,
    activeSafe.address,
    activeSafe.chainId,
    addressBookCheck,
    addressBookState.contacts,
    signers,
    suspiciousDetection,
  ])

  return result
}
