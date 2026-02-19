import { useWatch } from 'react-hook-form'
import { X } from 'lucide-react'
import { validateAddress } from '@safe-global/utils/utils/validation'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import type { InviteMembersFormValues } from '../hooks/useInviteForm'
import AddressIdenticon from './AddressIdenticon'

const ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.ADMIN]: 'Admin',
  [MemberRole.MEMBER]: 'Member',
}

interface MemberInviteRowProps {
  index: number
  control: ReturnType<typeof import('react-hook-form').useForm<InviteMembersFormValues>>['control']
  register: ReturnType<typeof import('react-hook-form').useForm<InviteMembersFormValues>>['register']
  canRemove: boolean
  onRemove: () => void
}

const MemberInviteRow = ({ index, control, register, canRemove, onRemove }: MemberInviteRowProps) => {
  const addressValue = useWatch({ control, name: `members.${index}.address` })

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <AddressIdenticon address={addressValue || ''} />
        </div>
        <Input
          {...register(`members.${index}.address`, {
            required: index === 0,
            validate: (value) => {
              if (!value.trim()) return undefined
              return validateAddress(value)
            },
          })}
          placeholder="Type wallet address"
          className="h-11 rounded-lg bg-card pl-12 pr-4"
          data-testid={`invite-address-input-${index}`}
        />
      </div>

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
