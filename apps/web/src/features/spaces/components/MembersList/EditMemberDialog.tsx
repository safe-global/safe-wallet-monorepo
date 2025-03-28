import ModalDialog from '@/components/common/ModalDialog'
import { DialogContent, DialogActions, Button, Typography } from '@mui/material'
import { type Member, useMembersUpdateRoleV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import MemberInfoForm from '@/features/spaces/components/AddMemberModal/MemberInfoForm'

type MemberField = {
  name: string
  role: Member['role']
}

const EditMemberDialog = ({ member, handleClose }: { member: Member; handleClose: () => void }) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [editMember] = useMembersUpdateRoleV1Mutation()
  const [error, setError] = useState<string>()

  const methods = useForm<MemberField>({
    mode: 'onChange',
    defaultValues: {
      name: member.name,
      role: member.role,
    },
  })

  const { handleSubmit, formState } = methods

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

      dispatch(
        showNotification({
          message: `Updated role of ${data.name} to ${data.role}`,
          variant: 'success',
          groupKey: 'update-member-success',
        }),
      )

      handleClose()
    } catch (e) {
      setError('An unexpected error occurred while editing the member.')
    }
  })

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Edit member" hideChainIndicator>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ p: '24px !important' }}>
            <Typography mb={2}>
              Edit the role of <b>{`${member.name}`}</b> in this space.
            </Typography>

            <MemberInfoForm isEdit />
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
