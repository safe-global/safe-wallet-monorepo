import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Loader2, X } from 'lucide-react'
import type { MemberRole } from '@/features/spaces'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type MemberInviteRoleField = { value: MemberRole; onChange: (...event: unknown[]) => void }

export type MemberInviteRowViewProps = {
  index: number
  identifierField: UseFormRegisterReturn
  resolving: boolean
  displayError?: string
  hasResolverError: boolean
  adminRole: MemberRole
  memberRole: MemberRole
  renderRoleField: (render: (field: MemberInviteRoleField) => ReactNode) => ReactNode
  canRemove: boolean
  onRemove: () => void
}

const MemberInviteRowView = ({
  index,
  identifierField,
  resolving,
  displayError,
  hasResolverError,
  adminRole,
  memberRole,
  renderRoleField,
  canRemove,
  onRemove,
}: MemberInviteRowViewProps) => {
  const roleLabels: Record<string, string> = { [adminRole]: 'Admin', [memberRole]: 'Member' }

  return (
    // items-start so a validation error grows the field column downwards; the controls stay level with the field.
    <div className="flex items-start gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <div className="relative">
          <Input
            address
            autoComplete="off"
            {...identifierField}
            placeholder="Email, wallet address or ENS name"
            variant="surface"
            // eslint-disable-next-line no-restricted-syntax -- bespoke 44px invite field (h-11, rounded-lg, px-4); between the lg/xl tiers, no size fits
            className={cn('h-11 rounded-lg px-4', resolving && 'pr-10')}
            error={displayError}
            errorSize="xs"
            data-testid={`invite-identifier-input-${index}`}
          />
          {resolving && (
            <div className="pointer-events-none absolute right-3 top-0 flex h-11 items-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {hasResolverError && <p className="text-xs text-destructive">Failed to resolve ENS name</p>}
      </div>

      <div className="flex h-11 items-center gap-2">
        {renderRoleField((field) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="min-w-[120px] cursor-pointer data-[size=default]:h-11">
              <SelectValue placeholder="Role">{roleLabels[field.value]}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              <SelectItem value={adminRole}>{roleLabels[adminRole]}</SelectItem>
              <SelectItem value={memberRole}>{roleLabels[memberRole]}</SelectItem>
            </SelectContent>
          </Select>
        ))}

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
    </div>
  )
}

export { MemberInviteRowView }
