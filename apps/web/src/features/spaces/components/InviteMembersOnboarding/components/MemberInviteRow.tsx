import { useCallback, useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import type { UseFormSetValue, UseFormReturn, UseFormTrigger } from 'react-hook-form'
import { Loader2, X } from 'lucide-react'
import { checksumAddress, isChecksummedAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { isDomain } from '@/services/ens'
import { MemberRole } from '../../../hooks/useSpaceMembers'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import type { InviteMembersFormValues } from '../hooks/useInviteForm'
import { EMAIL_MAX_LENGTH, INVALID_IDENTIFIER_ERROR, isEmailAddress } from '../../AddMemberModal/utils'

const ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.ADMIN]: 'Admin',
  [MemberRole.MEMBER]: 'Member',
}

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
  } = useNameResolver(isEmailAddress(identifierValue.trim()) ? '' : identifierValue)

  useEffect(() => {
    if (resolvedAddress) handleAddressResolved(resolvedAddress)
  }, [resolvedAddress, handleAddressResolved])

  return (
    <div className="flex gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <div className="relative">
          <Input
            address
            autoComplete="off"
            {...register(`members.${index}.identifier`, {
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
                  (member, i) =>
                    i !== index && member.identifier?.trim() && sameAddress(member.identifier.trim(), trimmed),
                )
                if (isDuplicate) return 'Address already added'
              },
            })}
            placeholder="Email, wallet address or ENS name"
            variant="surface"
            // eslint-disable-next-line no-restricted-syntax -- bespoke 44px invite field (h-11, rounded-lg, px-4); between the lg/xl tiers, no size fits
            className={cn('h-11 rounded-lg px-4', resolving && 'pr-10')}
            error={displayError}
            data-testid={`invite-identifier-input-${index}`}
          />
          {resolving && (
            <div className="pointer-events-none absolute right-3 top-0 flex h-11 items-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {resolverError && <p className="pl-1 text-xs text-destructive">Failed to resolve ENS name</p>}
      </div>

      <Controller
        control={control}
        name={`members.${index}.role`}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="min-w-[120px] cursor-pointer data-[size=default]:h-11">
              <SelectValue placeholder="Role">{ROLE_LABELS[field.value]}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              <SelectItem value={MemberRole.ADMIN}>{ROLE_LABELS[MemberRole.ADMIN]}</SelectItem>
              <SelectItem value={MemberRole.MEMBER}>{ROLE_LABELS[MemberRole.MEMBER]}</SelectItem>
            </SelectContent>
          </Select>
        )}
      />

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove member"
          data-testid={`remove-member-${index}`}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}

export default MemberInviteRow
