import NameInput from '@/components/common/NameInput'
import { Controller, useFormContext } from 'react-hook-form'
import { MenuItem, Select, Stack } from '@mui/material'
import { RoleMenuItem } from '@/features/spaces/components/AddMemberModal/index'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'

const MemberInfoForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const { control } = useFormContext()

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <NameInput name="name" label="Name" required disabled={isEdit} />

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
            sx={{ minWidth: '150px', py: 0.5 }}
            renderValue={(role) => <RoleMenuItem role={role as MemberRole} />}
          >
            <MenuItem value={MemberRole.ADMIN}>
              <RoleMenuItem role={MemberRole.ADMIN} hasDescription selected={value === MemberRole.ADMIN} />
            </MenuItem>
            <MenuItem value={MemberRole.MEMBER}>
              <RoleMenuItem role={MemberRole.MEMBER} hasDescription selected={value === MemberRole.MEMBER} />
            </MenuItem>
          </Select>
        )}
      />
    </Stack>
  )
}

export default MemberInfoForm
