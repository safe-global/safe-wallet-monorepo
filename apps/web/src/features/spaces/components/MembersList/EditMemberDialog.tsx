import ModalDialog from '@/components/common/ModalDialog'
import { DialogContent, DialogActions, Button, Typography } from '@mui/material'
import {
  type MemberDto,
  useMembersUpdateAliasV1Mutation,
  useMembersUpdateRoleV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import {
  useCurrentSpaceId,
  useAdminCount,
  isActiveAdmin,
  getMemberDisplayName,
  sanitizeMemberAlias,
  MEMBER_ALIAS_MAX_LENGTH,
} from '@/features/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { showNotification } from '@/store/notificationsSlice'
import MemberInfoForm from '../AddMemberModal/MemberInfoForm'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { capitalize } from '@safe-global/utils/utils/formatters'

type MemberField = {
  name: string
  role: MemberDto['role']
}

const EditMemberDialog = ({ member, handleClose }: { member: MemberDto; handleClose: () => void }) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [updateAlias] = useMembersUpdateAliasV1Mutation()
  const [updateRole] = useMembersUpdateRoleV1Mutation()
  const [error, setError] = useState<string>()

  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const adminCount = useAdminCount()

  // A member may only rename themselves; the last active admin keeps their role locked to preserve ownership.
  const canEditName = member.user.id === currentUser?.id
  const disableRole = adminCount === 1 && isActiveAdmin(member)
  const displayName = getMemberDisplayName(member)

  const methods = useForm<MemberField>({
    mode: 'onChange',
    defaultValues: {
      name: displayName,
      role: member.role,
    },
  })

  const { handleSubmit, formState, watch } = methods
  const roleValue = watch('role')
  const sanitizedName = sanitizeMemberAlias(watch('name'))
  const hasNameChanged = canEditName && sanitizedName !== displayName
  const hasRoleChanged = !disableRole && roleValue !== member.role
  const canSubmit = formState.isValid && (hasNameChanged || hasRoleChanged) && !formState.isSubmitting

  const onSubmit = handleSubmit(async () => {
    setError(undefined)

    if (!spaceId) {
      setError('Something went wrong. Please try again.')
      return
    }

    try {
      if (hasNameChanged) {
        const { error } = await updateAlias({ spaceId, updateMemberAliasDto: { alias: sanitizedName } })

        if (error) {
          setError(getRtkQueryErrorMessage(error as FetchBaseQueryError | SerializedError))
          return
        }
      }

      if (hasRoleChanged) {
        const { error } = await updateRole({
          spaceId,
          userId: member.user.id,
          updateRoleDto: { role: roleValue },
        })

        if (error) {
          setError(getRtkQueryErrorMessage(error as FetchBaseQueryError | SerializedError))
          return
        }
      }
    } catch (e) {
      setError(getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError))
      return
    }

    if (hasNameChanged) {
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_NAME_CHANGED, label: spaceId },
        { workspace_id: spaceId, user_id: member.user.id },
      )
    }

    if (hasRoleChanged) {
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_ROLE_CHANGED, label: spaceId },
        {
          workspace_id: spaceId,
          target_user_id: member.user.id,
          from_role: member.role.toLowerCase(),
          to_role: roleValue.toLowerCase(),
        },
      )
    }

    const roleLabel = capitalize(roleValue.toLowerCase())
    const successMessage =
      hasNameChanged && hasRoleChanged
        ? `Updated your name and role to ${roleLabel}`
        : hasNameChanged
          ? 'Your name was updated'
          : `Updated role of ${displayName} to ${roleLabel}`

    dispatch(
      showNotification({
        message: successMessage,
        variant: 'success',
        groupKey: 'update-member-success',
      }),
    )

    handleClose()
  })

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Edit member" hideChainIndicator>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ p: '24px !important' }}>
            <Typography mb={2}>
              Edit <b>{displayName}</b> in this workspace.
            </Typography>

            <MemberInfoForm
              isEdit
              disableName={!canEditName}
              disableRole={disableRole}
              nameMaxLength={MEMBER_ALIAS_MAX_LENGTH}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" data-testid="delete-btn" variant="danger" disableElevation disabled={!canSubmit}>
              Update
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default EditMemberDialog
