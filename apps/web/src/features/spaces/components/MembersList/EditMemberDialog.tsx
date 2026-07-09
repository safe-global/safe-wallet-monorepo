import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import { type MemberDto, useMembersUpdateRoleV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import MemberInfoForm from '../AddMemberModal/MemberInfoForm'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

type MemberField = {
  name: string
  role: MemberDto['role']
}

const EditMemberDialog = ({ member, handleClose }: { member: MemberDto; handleClose: () => void }) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [editMember] = useMembersUpdateRoleV1Mutation()
  const [error, setError] = useState<string>()
  const isDarkMode = useDarkMode()

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
        spaceId: spaceId ?? '',
        userId: member.user.id,
        updateRoleDto: {
          role: data.role,
        },
      })

      if (error) {
        setError(getRtkQueryErrorMessage(error as FetchBaseQueryError | SerializedError))
        return
      }
    } catch (e) {
      setError(getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError))
      return
    }

    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_MEMBER_ROLE_CHANGED, label: spaceId },
      {
        workspace_id: spaceId,
        target_user_id: member.user.id,
        from_role: member.role.toLowerCase(),
        to_role: data.role.toLowerCase(),
      },
    )

    dispatch(
      showNotification({
        message: `Updated role of ${data.name} to ${data.role}`,
        variant: 'success',
        groupKey: 'update-member-success',
      }),
    )

    handleClose()
  })

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Edit member" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <div className="p-6">
              <Typography variant="paragraph" className="mb-4">
                Edit the role of <b>{`${member.name}`}</b> in this space.
              </Typography>

              <MemberInfoForm isEdit />
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </div>

            <DialogActions
              className="px-6 pb-6"
              onCancel={handleClose}
              cancelTestId="cancel-btn"
              confirmLabel="Update"
              confirmType="submit"
              confirmDisabled={!formState.isDirty}
              confirmTestId="delete-btn"
            />
          </form>
        </FormProvider>
      </div>
    </ModalDialog>
  )
}

export default EditMemberDialog
