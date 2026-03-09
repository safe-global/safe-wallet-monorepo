import { useCallback } from 'react'
import { useWatch } from 'react-hook-form'
import type { UseFormSetValue, UseFormReturn } from 'react-hook-form'
import { X } from 'lucide-react'
import { checksumAddress, isChecksummedAddress } from '@safe-global/utils/utils/addresses'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { isDomain } from '@/services/ens'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import type { InviteMembersFormValues } from '../hooks/useInviteForm'
import EnsAddressIdenticon from './EnsAddressIdenticon'

const ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.ADMIN]: 'Admin',
  [MemberRole.MEMBER]: 'Member',
}

const ADDRESS_RE = /^0x[0-9a-f]{40}$/i

interface MemberInviteRowProps {
  index: number
  control: UseFormReturn<InviteMembersFormValues>['control']
  register: UseFormReturn<InviteMembersFormValues>['register']
  errors: UseFormReturn<InviteMembersFormValues>['formState']['errors']
  setValue: UseFormSetValue<InviteMembersFormValues>
  canRemove: boolean
  onRemove: () => void
}

const MemberInviteRow = ({ index, control, register, errors, setValue, canRemove, onRemove }: MemberInviteRowProps) => {
  const addressValue = useWatch({ control, name: `members.${index}.address` })
  const fieldError = errors?.members?.[index]?.address
  const debouncedError = useDebounce(fieldError, 500)
  const displayError = fieldError ? debouncedError : undefined

  const handleAddressResolved = useCallback(
    (address: string) => {
      setValue(`members.${index}.address`, address, { shouldValidate: true })
    },
    [setValue, index],
  )

  return (
    <div className="flex gap-2">
      <EnsAddressIdenticon address={addressValue || ''} onAddressResolved={handleAddressResolved}>
        <Input
          {...register(`members.${index}.address`, {
            required: index === 0,
            validate: (value) => {
              if (!value.trim()) return undefined
              if (isDomain(value)) return undefined

              if (!ADDRESS_RE.test(value)) return 'Invalid address'

              const hex = value.slice(2)
              const hasNoChecksumIntent = hex === hex.toLowerCase() || hex === hex.toUpperCase()

              if (hasNoChecksumIntent) {
                const checksummed = checksumAddress(value.toLowerCase())
                if (checksummed !== value) {
                  setValue(`members.${index}.address`, checksummed, { shouldValidate: true })
                }
                return undefined
              }

              if (!isChecksummedAddress(value)) {
                return 'Invalid address checksum'
              }
            },
          })}
          placeholder="Wallet address or ENS name"
          className="h-11 rounded-lg bg-card pl-12 pr-4"
          error={displayError?.message}
          data-testid={`invite-address-input-${index}`}
        />
      </EnsAddressIdenticon>

      <Controller
        control={control}
        name={`members.${index}.role`}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="min-w-[120px] cursor-pointer rounded-lg bg-card data-[size=default]:h-11">
              <SelectValue placeholder="Role">{ROLE_LABELS[field.value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
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
