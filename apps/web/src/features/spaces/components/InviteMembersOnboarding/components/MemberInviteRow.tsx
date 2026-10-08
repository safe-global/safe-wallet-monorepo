import { useCallback, useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import type { UseFormSetValue, UseFormReturn, UseFormTrigger } from 'react-hook-form'
import { checksumAddress, isChecksummedAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { isDomain } from '@/services/ens'
import { MemberRole } from '../../../hooks/useSpaceMembers'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import useChains from '@/hooks/useChains'
import { DEFAULT_MAINNET_CHAIN_ID } from '@/config/constants'
import { Controller } from 'react-hook-form'
import type { InviteMembersFormValues } from '../hooks/useInviteForm'
import { EMAIL_MAX_LENGTH, INVALID_IDENTIFIER_ERROR, isEmailAddress } from '../../AddMemberModal/utils'
import { MemberInviteRowView } from '@views/features/spaces/components/InviteMembersOnboarding/components/MemberInviteRowView'

const ADDRESS_RE = /^0x[0-9a-f]{40}$/i
const ERROR_DEBOUNCE_MS = 500
const INVALID_ADDRESS_ERROR = 'Invalid address'

type AutoChecksumCallback = (checksummed: string) => void

function validateEthereumAddress(value: string, onAutoChecksum: AutoChecksumCallback): string | undefined {
  // A "0x" prefix signals an address attempt — show the address-specific error rather than the generic one
  const looksLikeAddress = value.toLowerCase().startsWith('0x')

  if (!ADDRESS_RE.test(value)) {
    return looksLikeAddress ? INVALID_ADDRESS_ERROR : INVALID_IDENTIFIER_ERROR
  }

  const hex = value.slice(2)
  const hasNoChecksumIntent = hex === hex.toLowerCase() || hex === hex.toUpperCase()

  if (hasNoChecksumIntent) {
    const checksummed = checksumAddress(value.toLowerCase())
    if (checksummed !== value) onAutoChecksum(checksummed)
    return undefined
  }

  if (!isChecksummedAddress(value)) return INVALID_ADDRESS_ERROR

  return undefined
}

interface MemberInviteRowProps {
  index: number
  control: UseFormReturn<InviteMembersFormValues>['control']
  register: UseFormReturn<InviteMembersFormValues>['register']
  errors: UseFormReturn<InviteMembersFormValues>['formState']['errors']
  setValue: UseFormSetValue<InviteMembersFormValues>
  trigger: UseFormTrigger<InviteMembersFormValues>
  canRemove: boolean
  onRemove: () => void
}

const MemberInviteRow = ({
  index,
  control,
  register,
  errors,
  setValue,
  trigger,
  canRemove,
  onRemove,
}: MemberInviteRowProps) => {
  const members = useWatch({ control, name: 'members' })
  const identifierValue = members?.[index]?.identifier ?? ''
  const fieldErrorMessage = errors?.members?.[index]?.identifier?.message
  const debouncedError = useDebounce(fieldErrorMessage, ERROR_DEBOUNCE_MS)
  const displayError = fieldErrorMessage ? debouncedError : undefined
  const { configs: allNetworks } = useChains()
  // Space invites are chain-agnostic — resolve ENS on mainnet, not the current Safe chain
  const ensChain = allNetworks.find((chain) => chain.chainId === String(DEFAULT_MAINNET_CHAIN_ID))

  const handleAddressResolved = useCallback(
    (address: string) => {
      setValue(`members.${index}.identifier`, address, { shouldValidate: true })
    },
    [setValue, index],
  )

  // Emails are not ENS names — don't try to resolve them (it would surface a resolver error).
  const {
    address: resolvedAddress,
    resolverError,
    resolving,
  } = useNameResolver(isEmailAddress(identifierValue.trim()) ? '' : identifierValue, ensChain)

  useEffect(() => {
    if (resolvedAddress) handleAddressResolved(resolvedAddress)
  }, [resolvedAddress, handleAddressResolved])

  const identifierField = register(`members.${index}.identifier`, {
    required: index === 0,
    onChange: () => {
      const otherFields = members
        ?.map((_, i) => (i !== index ? (`members.${i}.identifier` as const) : null))
        .filter(Boolean) as `members.${number}.identifier`[]
      if (otherFields?.length) trigger(otherFields)
    },
    validate: (value) => {
      const trimmed = value?.trim()
      if (!trimmed) return undefined

      if (isEmailAddress(trimmed)) {
        if (trimmed.length > EMAIL_MAX_LENGTH) return `Email must be ${EMAIL_MAX_LENGTH} characters or less.`

        const isDuplicateEmail = members?.some((member, i) => {
          // Trim to match the trimmed-on-submit value
          const otherIdentifier = member.identifier?.trim()
          return (
            i !== index &&
            otherIdentifier &&
            isEmailAddress(otherIdentifier) &&
            otherIdentifier.toLowerCase() === trimmed.toLowerCase()
          )
        })
        if (isDuplicateEmail) return 'Email already added'

        return undefined
      }

      if (isDomain(trimmed)) return undefined

      const addressError = validateEthereumAddress(trimmed, (checksummed) => {
        setValue(`members.${index}.identifier`, checksummed, { shouldValidate: true })
      })
      if (addressError) return addressError

      const isDuplicate = members?.some(
        (member, i) => i !== index && member.identifier?.trim() && sameAddress(member.identifier.trim(), trimmed),
      )
      if (isDuplicate) return 'Address already added'
    },
  })

  return (
    <MemberInviteRowView
      index={index}
      identifierField={identifierField}
      resolving={resolving}
      displayError={displayError}
      hasResolverError={Boolean(resolverError)}
      adminRole={MemberRole.ADMIN}
      memberRole={MemberRole.MEMBER}
      renderRoleField={(render) => (
        <Controller
          control={control}
          name={`members.${index}.role`}
          render={({ field }) => <>{render({ value: field.value, onChange: field.onChange })}</>}
        />
      )}
      canRemove={canRemove}
      onRemove={onRemove}
    />
  )
}

export default MemberInviteRow
