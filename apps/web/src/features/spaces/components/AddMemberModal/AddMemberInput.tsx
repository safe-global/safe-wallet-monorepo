import { type ReactElement, useEffect, useMemo, useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { isAddress } from 'ethers'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import useAddressBook from '@/hooks/useAddressBook'
import useChains from '@/hooks/useChains'
import { useAddressBookSearch } from '@/features/spaces'
import { DEFAULT_MAINNET_CHAIN_ID } from '@/config/constants'
import { EMAIL_MAX_LENGTH, isEmailAddress } from './utils'
import {
  AddMemberInputView,
  type InviteeIdentifierOption,
} from '@views/features/spaces/components/AddMemberModal/AddMemberInputView'

type AddMemberInputProps = {
  error?: string
  inputProps: UseFormRegisterReturn<'inviteeIdentifier'>
  onSelectAddress: (address: string, name: string) => void
  value: string
}

const MAX_VISIBLE_OPTIONS = 5

// Debounce the email avatar so its color doesn't flicker on every keystroke.
const AVATAR_DEBOUNCE_MS = 500

/**
 * Invite-specific input for choosing who to invite.
 *
 * Unlike AddressBookInput/AddressInput, this accepts either an email or a wallet
 * inviteeIdentifier. Address-book names and ENS names are resolved to addresses before
 * submit; emails are kept as-is.
 *
 * ENS invites are chain-agnostic (space members, not Safe-chain recipients), so names resolve
 * against mainnet regardless of the currently viewed Safe.
 */
const AddMemberInput = ({ error, inputProps, onSelectAddress, value }: AddMemberInputProps): ReactElement => {
  const addressBook = useAddressBook()
  const { configs: allNetworks } = useChains()
  const ensChain = allNetworks.find((chain) => chain.chainId === String(DEFAULT_MAINNET_CHAIN_ID))
  const [isOpen, setIsOpen] = useState(false)
  const inviteeIdentifier = value.trim()
  const shouldResolveEns = Boolean(
    inviteeIdentifier && !isEmailAddress(inviteeIdentifier) && !isAddress(inviteeIdentifier),
  )
  const { address: resolvedAddress } = useNameResolver(shouldResolveEns ? inviteeIdentifier : '', ensChain)

  useEffect(() => {
    if (resolvedAddress) {
      onSelectAddress(resolvedAddress, inviteeIdentifier)
    }
  }, [inviteeIdentifier, onSelectAddress, resolvedAddress])

  const contacts = useMemo<InviteeIdentifierOption[]>(
    () => Object.entries(addressBook).map(([address, name]) => ({ address, name })),
    [addressBook],
  )

  const matches = useAddressBookSearch(contacts, inviteeIdentifier)
  const options = useMemo(
    () => (isAddress(inviteeIdentifier) ? [] : matches.slice(0, MAX_VISIBLE_OPTIONS)),
    [inviteeIdentifier, matches],
  )

  const showIdenticon = Boolean(value && !error && isAddress(value))

  // The initials avatar colors itself from the full email, which would change
  // on every keystroke. Debounce it so the color doesn't flicker while typing.
  const debouncedIdentifier = useDebounce(inviteeIdentifier, AVATAR_DEBOUNCE_MS)
  const showInitials = Boolean(debouncedIdentifier && !error && !showIdenticon && isEmailAddress(debouncedIdentifier))

  return (
    <AddMemberInputView
      error={error}
      inputProps={inputProps}
      value={value}
      maxLength={EMAIL_MAX_LENGTH}
      options={options}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onToggleOpen={() => setIsOpen((open) => !open)}
      showIdenticon={showIdenticon}
      showInitials={showInitials}
      initialsName={debouncedIdentifier}
    />
  )
}

export default AddMemberInput
