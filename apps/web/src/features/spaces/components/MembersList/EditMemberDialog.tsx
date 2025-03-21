import ModalDialog from '@/components/common/ModalDialog'
import { DialogContent, DialogActions, Button, Typography, Select, MenuItem, Stack } from '@mui/material'
import { type Member, useMembersUpdateRoleV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useState } from 'react'
import NameInput from '@/components/common/NameInput'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { RoleMenuItem } from '@/features/spaces/components/AddMembersModal'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'

type MemberField = {
  name: string
  role: Member['role']
}

const EditMemberDialog = ({ member, handleClose }: { member: Member; handleClose: () => void }) => {
  const spaceId = useCurrentSpaceId()
  const [editMember] = useMembersUpdateRoleV1Mutation()
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

    if (!spaceId) {
      setError('Something went wrong. Please try again.')
      return
    }

    try {
      const { error } = await editMember({
        spaceId: Number(spaceId),
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
              Edit the role of <b>{`${member.name}`}</b> in this space.
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
