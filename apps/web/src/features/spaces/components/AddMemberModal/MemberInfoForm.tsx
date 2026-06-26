import NameInput from '@/components/common/NameInput'
import { Controller, useFormContext } from 'react-hook-form'
import { MenuItem, Select, Stack } from '@mui/material'
import { RoleMenuItem } from './index'
import { MemberRole } from '@/features/spaces'
import css from './styles.module.css'

const MemberInfoForm = ({
  disableName = false,
  disableRole = false,
}: {
  disableName?: boolean
  disableRole?: boolean
}) => {
  const { control } = useFormContext()

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <NameInput data-testid="member-name-input" name="name" label="Name" required disabled={disableName} />

      {/* Both callers seed `role` via useForm defaultValues, so no Controller defaultValue */}
      <Controller
        control={control}
        name="role"
        render={({ field: { value, onChange, ...field } }) => (
          <Select
            {...field}
            value={value}
            onChange={onChange}
            required
            className={css.roleSelect}
            disabled={disableRole}
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
