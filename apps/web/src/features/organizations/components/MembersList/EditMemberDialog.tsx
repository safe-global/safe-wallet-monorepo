import ModalDialog from '@/components/common/ModalDialog'
import { DialogContent, DialogActions, Button, Typography, Select, MenuItem, Stack } from '@mui/material'
import {
  type UserOrganization,
  useUserOrganizationsUpdateRoleV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useState } from 'react'
import NameInput from '@/components/common/NameInput'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { RoleMenuItem } from '@/features/organizations/components/AddMembersModal'
import { MemberRole } from '@/features/organizations/hooks/useOrgMembers'

type MemberField = {
  name: string
  role: UserOrganization['role']
}

const EditMemberDialog = ({ member, handleClose }: { member: UserOrganization; handleClose: () => void }) => {
  const orgId = useCurrentOrgId()
  const [editMember] = useUserOrganizationsUpdateRoleV1Mutation()
  const [error, setError] = useState<string>()

  const methods = useForm<MemberField>({
    mode: 'onChange',
    defaultValues: {
      name: member.name,
      role: member.role,
    },
  })

  const { handleSubmit, control, formState } = methods

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    if (!orgId) {
      setError('Something went wrong. Please try again.')
      return
    }

    try {
      const { error } = await editMember({
        orgId: Number(orgId),
        userId: member.user.id,
        updateRoleDto: {
          role: data.role,
        },
      })

      if (error) {
        throw error
      }
      handleClose()
    } catch (e) {
      setError('An unexpected error occurred while editing the member.')
    }
  })

  // TODO: Change this once it is possible to edit a members name
  const isEditNameDisabled = true

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Edit member" hideChainIndicator>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ p: '24px !important' }}>
            <Typography mb={2}>
              Edit the role of <b>{`${member.name}`}</b> in this organization.
            </Typography>

            {/* TODO: Check if its possible to extract this to be reused in add/edit member */}
            <Stack direction="row" spacing={2} alignItems="center">
              <NameInput name="name" label="Name" required disabled={isEditNameDisabled} />

              <Controller
                control={control}
                name="role"
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
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="delete-btn"
              variant="danger"
              disableElevation
              disabled={!formState.isDirty}
            >
              Update
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default EditMemberDialog
