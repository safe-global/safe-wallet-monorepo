import type { ReactNode } from 'react'
import type { MemberRole } from '@/features/spaces'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldLabel } from '@/components/ui/field'
import { RoleMenuItemView } from '@views/features/spaces/components/AddMemberModal/AddMemberModalView'

export type MemberInfoNameInputSlotProps = {
  'data-testid': string
  label: string
  InputProps: { className: string }
  errorPlacement: 'floating'
  className: string
}

export type MemberRoleField = { value: MemberRole; onChange: (...event: unknown[]) => void }

export type MemberInfoFormViewProps = {
  adminRole: MemberRole
  memberRole: MemberRole
  disableRole: boolean
  renderNameInput: (props: MemberInfoNameInputSlotProps) => ReactNode
  renderRoleField: (render: (field: MemberRoleField) => ReactNode) => ReactNode
}

export const MemberInfoFormView = ({
  adminRole,
  memberRole,
  disableRole,
  renderNameInput,
  renderRoleField,
}: MemberInfoFormViewProps) => {
  return (
    // Top-aligned so the Name error can't drag the Role select down; spacer label keeps them level.
    <div className="flex flex-row items-start gap-4">
      {renderNameInput({
        'data-testid': 'member-name-input',
        label: 'Name',
        InputProps: { className: 'min-h-[66px]' },
        errorPlacement: 'floating',
        className: 'gap-1.5',
      })}

      <div className="flex flex-col gap-1.5">
        <FieldLabel aria-hidden className="invisible">
          Role
        </FieldLabel>

        {renderRoleField(({ value, onChange }) => (
          <Select value={value} onValueChange={onChange} required disabled={disableRole}>
            <SelectTrigger aria-label="Role" className="min-h-[66px]! min-w-[150px]">
              <SelectValue>{(role) => <RoleMenuItemView isAdmin={role === adminRole} />}</SelectValue>
            </SelectTrigger>
            {/* No `showBackdrop`: both consumers are ModalDialogs, which already own the scrim. */}
            <SelectContent align="end" alignItemWithTrigger={false} className=" min-h-[66px] w-[340px]">
              <SelectItem value={adminRole}>
                <RoleMenuItemView isAdmin hasDescription />
              </SelectItem>
              <SelectItem value={memberRole}>
                <RoleMenuItemView isAdmin={false} hasDescription />
              </SelectItem>
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  )
}
