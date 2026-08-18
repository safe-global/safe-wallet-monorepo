import NameInput from '@/components/common/NameInput'
import { MEMBER_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@safe-global/utils/validation/names'
import { Controller, useFormContext } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldLabel } from '@/components/ui/field'
import { RoleMenuItem } from './index'
import { MemberRole } from '@/features/spaces'

const MemberInfoForm = ({
  isEdit = false,
  disableName = isEdit,
  disableRole = false,
  nameMaxLength = MEMBER_NAME_MAX_LENGTH,
}: {
  isEdit?: boolean
  disableName?: boolean
  disableRole?: boolean
  nameMaxLength?: number
}) => {
  const { control } = useFormContext()

  return (
    // Top-aligned so the Name error can't drag the Role select down; spacer label keeps them level.
    <div className="flex flex-row items-start gap-4">
      <NameInput
        data-testid="member-name-input"
        name="name"
        label="Name"
        required
        disabled={disableName}
        validateCharset
        minLength={NAME_MIN_LENGTH}
        maxLength={nameMaxLength}
        InputProps={{ className: 'min-h-[66px]' }}
        // Float the error so it doesn't grow the field's height and shift the form.
        className="gap-1.5 relative [&_[data-slot=field-error]]:absolute [&_[data-slot=field-error]]:top-full"
      />

      <div className="flex flex-col gap-1.5">
        <FieldLabel aria-hidden className="invisible">
          Role
        </FieldLabel>

        <Controller
          control={control}
          name="role"
          defaultValue={MemberRole.MEMBER}
          render={({ field: { value, onChange } }) => (
            <Select value={value} onValueChange={onChange} required disabled={disableRole}>
              <SelectTrigger aria-label="Role" className="min-h-[66px]! min-w-[150px]">
                <SelectValue>{(role) => <RoleMenuItem role={role as MemberRole} />}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false} showBackdrop className=" min-h-[66px] w-[340px]">
                <SelectItem value={MemberRole.ADMIN}>
                  <RoleMenuItem role={MemberRole.ADMIN} hasDescription />
                </SelectItem>
                <SelectItem value={MemberRole.MEMBER}>
                  <RoleMenuItem role={MemberRole.MEMBER} hasDescription />
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  )
}

export default MemberInfoForm
