import NameInput from '@/components/common/NameInput'
import { MEMBER_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@safe-global/utils/validation/names'
import { Controller, useFormContext } from 'react-hook-form'
import { MenuItem, Select, Stack } from '@mui/material'
import { RoleMenuItem } from './index'
import { MemberRole } from '@/features/spaces'
import css from './styles.module.css'

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
    <Stack direction="row" spacing={2} alignItems="center">
      <NameInput
        data-testid="member-name-input"
        name="name"
        label="Name"
        required
        disabled={disableName}
        validateCharset
        minLength={NAME_MIN_LENGTH}
        maxLength={nameMaxLength}
      />

      <Controller
        control={control}
        name="role"
        defaultValue={MemberRole.MEMBER}
        render={({ field: { value, onChange, ...field } }) => (
          <Select
            {...field}
            value={value}
            onChange={onChange}
            required
            disabled={disableRole}
            className={css.roleSelect}
            renderValue={(role) => <RoleMenuItem role={role as MemberRole} />}
          >
            <MenuItem value={MemberRole.ADMIN} className={css.menuItem}>
              <RoleMenuItem role={MemberRole.ADMIN} hasDescription selected={value === MemberRole.ADMIN} />
            </MenuItem>
            <MenuItem value={MemberRole.MEMBER} className={css.menuItem}>
              <RoleMenuItem role={MemberRole.MEMBER} hasDescription selected={value === MemberRole.MEMBER} />
            </MenuItem>
          </Select>
        )}
      />
    </Stack>
  )
}

export default MemberInfoForm
