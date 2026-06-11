import ModalDialog from '@/components/common/ModalDialog'
import { DialogContent, DialogActions, Button, Typography } from '@mui/material'
import {
  type MemberDto,
  useMembersUpdateRoleV1Mutation,
  useMembersUpdateAliasV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, getMemberDisplayName } from '@/features/spaces'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import MemberInfoForm from '../AddMemberModal/MemberInfoForm'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

type MemberField = {
  name: string
  role: MemberDto['role']
}

const getMutationErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message.length > 0) {
        return message
      }
    }
  }
  return fallback
}

const EditMemberDialog = ({
  member,
  handleClose,
  isCurrentUser = false,
  disableRole = false,
}: {
  member: MemberDto
  handleClose: () => void
  isCurrentUser?: boolean
  disableRole?: boolean
}) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [editMember] = useMembersUpdateRoleV1Mutation()
  const [updateAlias] = useMembersUpdateAliasV1Mutation()
  const [error, setError] = useState<string>()

  const displayName = getMemberDisplayName(member)

  const methods = useForm<MemberField>({
    mode: 'onChange',
    defaultValues: {
      name: displayName,
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

    const newName = data.name.trim()

    // A member must always have a non-empty display name. Clearing it to revert to the
    // original invite name is not supported here — surface feedback instead of silently closing.
    if (isCurrentUser && newName === '') {
      setError('Name cannot be empty.')
      return
    }

    const isNameChanged = isCurrentUser && newName !== displayName
    const isRoleChanged = !disableRole && data.role !== member.role

    if (!isRoleChanged && !isNameChanged) {
      handleClose()
      return
    }

    // Update the role first, then the name. Success notifications are deferred until every
    // requested mutation resolves so the user never sees a success toast alongside an error.
    let roleUpdated = false

    if (isRoleChanged) {
      const { error } = await editMember({
        spaceId,
        userId: member.user.id,
        updateRoleDto: {
          role: data.role,
        },
      })

      if (error) {
        setError(getMutationErrorMessage(error, 'An unexpected error occurred while updating the role.'))
        return
      }

      roleUpdated = true
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_ROLE_CHANGED, label: spaceId },
        {
          workspace_id: spaceId,
          target_user_id: member.user.id,
          from_role: member.role.toLowerCase(),
          to_role: data.role.toLowerCase(),
        },
      )
    }

    if (isNameChanged) {
      const { error } = await updateAlias({
        spaceId,
        updateMemberAliasDto: {
          alias: newName,
        },
      })

      if (error) {
        setError(
          getMutationErrorMessage(
            error,
            roleUpdated
              ? 'The role was updated, but renaming failed. Please try again.'
              : 'An unexpected error occurred while updating your name.',
          ),
        )
        return
      }

      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_NAME_CHANGED, label: spaceId },
        { workspace_id: spaceId, target_user_id: member.user.id },
      )
    }

    if (roleUpdated) {
      dispatch(
        showNotification({
          message: isCurrentUser ? `Updated your role to ${data.role}` : `Updated role of ${newName} to ${data.role}`,
          variant: 'success',
          groupKey: 'update-member-role-success',
        }),
      )
    }

    if (isNameChanged) {
      dispatch(
        showNotification({
          message: `Updated your name to ${newName}`,
          variant: 'success',
          groupKey: 'update-member-name-success',
        }),
      )
    }

    handleClose()
  })

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Edit member" hideChainIndicator>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ p: '24px !important' }}>
            <Typography mb={2}>
              {isCurrentUser ? (
                <>Update your details as shown to everyone in this space.</>
              ) : (
                <>
                  Edit the role of <b>{`${displayName}`}</b> in this space.
                </>
              )}
            </Typography>

            <MemberInfoForm disableName={!isCurrentUser} disableRole={disableRole} />
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="update-btn"
              variant="contained"
              disableElevation
              disabled={!formState.isDirty || formState.isSubmitting}
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
