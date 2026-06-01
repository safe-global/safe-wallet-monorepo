import { useCallback, useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import type { UseFormSetValue, UseFormReturn, UseFormTrigger } from 'react-hook-form'
import { Loader2, X } from 'lucide-react'
import { checksumAddress, isChecksummedAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { isDomain } from '@/services/ens'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import type { InviteMembersFormValues } from '../hooks/useInviteForm'

const ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.ADMIN]: 'Admin',
  [MemberRole.MEMBER]: 'Member',
}

const ADDRESS_RE = /^0x[0-9a-f]{40}$/i
const ERROR_DEBOUNCE_MS = 500

type AutoChecksumCallback = (checksummed: string) => void

function validateEthereumAddress(value: string, onAutoChecksum: AutoChecksumCallback): string | undefined {
  if (!ADDRESS_RE.test(value)) return 'Invalid address'

  const hex = value.slice(2)
  const hasNoChecksumIntent = hex === hex.toLowerCase() || hex === hex.toUpperCase()

  if (hasNoChecksumIntent) {
    const checksummed = checksumAddress(value.toLowerCase())
    if (checksummed !== value) onAutoChecksum(checksummed)
    return undefined
  }

  if (!isChecksummedAddress(value)) return 'Invalid address checksum'

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
  const addressValue = members?.[index]?.address ?? ''
  const fieldErrorMessage = errors?.members?.[index]?.address?.message
  const debouncedError = useDebounce(fieldErrorMessage, ERROR_DEBOUNCE_MS)
  const displayError = fieldErrorMessage ? debouncedError : undefined

  const handleAddressResolved = useCallback(
    (address: string) => {
      setValue(`members.${index}.address`, address, { shouldValidate: true })
    },
    [setValue, index],
  )

  const { address: resolvedAddress, resolverError, resolving } = useNameResolver(addressValue)

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
            {...register(`members.${index}.address`, {
              required: index === 0,
              onChange: () => {
                const otherFields = members
                  ?.map((_, i) => (i !== index ? (`members.${i}.address` as const) : null))
                  .filter(Boolean) as `members.${number}.address`[]
                if (otherFields?.length) trigger(otherFields)
              },
              validate: (value) => {
                if (!value?.trim()) return undefined
                if (isDomain(value)) return undefined

                const addressError = validateEthereumAddress(value, (checksummed) => {
                  setValue(`members.${index}.address`, checksummed, { shouldValidate: true })
                })
                if (addressError) return addressError

                const isDuplicate = members?.some(
                  (member, i) => i !== index && member.address && sameAddress(member.address, value),
                )
                if (isDuplicate) return 'Address already added'
              },
            })}
            placeholder="Wallet address or ENS name"
            className={cn('h-11 rounded-lg bg-card px-4', resolving && 'pr-10')}
            error={displayError}
            data-testid={`invite-address-input-${index}`}
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
            <SelectTrigger className="min-w-[120px] cursor-pointer rounded-lg bg-card data-[size=default]:h-11">
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
