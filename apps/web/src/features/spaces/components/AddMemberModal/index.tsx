import { type ReactElement, useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import memberIcon from '@/public/images/spaces/member.svg'
import adminIcon from '@/public/images/spaces/admin.svg'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import css from './styles.module.css'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, MemberRole } from '@/features/spaces'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import MemberInfoForm from './MemberInfoForm'
import useAddressBook from '@/hooks/useAddressBook'
import { isAuthenticated } from '@/store/authSlice'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { isAddress } from 'ethers'
import {
  type MemberField,
  buildInviteUserPayload,
  getInviteeIdentifierValidationError,
  normalizeInviteeIdentifier,
} from './utils'
import AddMemberInput from './AddMemberInput'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

export const RoleMenuItem = ({
  role,
  hasDescription = false,
}: {
  role: MemberRole
  hasDescription?: boolean
}): ReactElement => {
  const isAdmin = role === MemberRole.ADMIN
  const Icon = isAdmin ? adminIcon : memberIcon

  return (
    <div className={cn('w-full items-center', css.roleMenuItem)}>
      <div className="flex items-center" style={{ gridArea: 'icon' }}>
        <Icon className="size-4" />
      </div>
      <Typography variant={hasDescription ? 'paragraph-bold' : 'paragraph'} style={{ gridArea: 'title' }}>
        {isAdmin ? 'Admin' : 'Member'}
      </Typography>
      {hasDescription && (
        <div style={{ gridArea: 'description' }}>
          <Typography variant="paragraph-small" className="max-w-[300px] break-words whitespace-normal">
            {isAdmin
              ? 'Admins can create and delete workspaces, invite members, and more.'
              : 'Can view the workspace data.'}
          </Typography>
        </div>
      )}
    </div>
  )
}

const AddMemberModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteMembers] = useMembersInviteUserV1Mutation()
  const addressBook = useAddressBook()
  const isDarkMode = useDarkMode()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: session } = useAuthGetMeV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const sessionEmail = session && 'email' in session && typeof session.email === 'string' ? session.email : undefined

  const methods = useForm<MemberField>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      inviteeIdentifier: '',
      role: MemberRole.MEMBER,
    },
  })

  const { handleSubmit, formState, register, watch, setValue } = methods

  const inviteeIdentifierValue = watch('inviteeIdentifier')
  const inviteeIdentifierInputProps = register('inviteeIdentifier', {
    required: true,
    validate: (value) => {
      return (
        getInviteeIdentifierValidationError({
          inviteeIdentifier: value,
          sessionEmail,
          walletAddresses: currentUser?.wallets?.map((wallet) => wallet.address),
        }) ?? true
      )
    },
  })

  useEffect(() => {
    if (!isAddress(inviteeIdentifierValue)) {
      return
    }

    const addressBookName = addressBook[inviteeIdentifierValue]
    if (addressBookName) {
      setValue('name', addressBookName, { shouldValidate: true })
    }
  }, [addressBook, inviteeIdentifierValue, setValue])

  const handleSelectAddress = useCallback(
    (address: string, name: string) => {
      setValue('inviteeIdentifier', address, { shouldValidate: true })
      setValue('name', name, { shouldValidate: true })
    },
    [setValue],
  )

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    const inviteeIdentifier = normalizeInviteeIdentifier(data.inviteeIdentifier)

    if (!spaceId) {
      setError('Something went wrong. Please try again.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await inviteMembers({
        spaceId: spaceId ?? '',
        inviteUsersDto: {
          users: [buildInviteUserPayload(data)],
        },
      })

      if (response.data) {
        response.data.forEach((invitation) => {
          trackEvent(
            { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: spaceId },
            { workspace_id: spaceId, user_id: invitation.userId, role: invitation.role.toLowerCase() },
          )
        })

        if (router.pathname !== AppRoutes.spaces.members) {
          router.push({ pathname: AppRoutes.spaces.members, query: { spaceId } })
        }

        dispatch(
          showNotification({
            message: `Invited ${data.name || inviteeIdentifier} to space`,
            variant: 'success',
            groupKey: 'invite-member-success',
          }),
        )

        onClose()
      }
      if (response.error) {
        setError(getRtkQueryErrorMessage(response.error) || 'Invite failed. Please try again.')
      }
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog open onClose={onClose} dialogTitle="Add member" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <div className="overflow-visible px-6 py-4">
              <Typography variant="paragraph" className="mb-4">
                Invite a member by email or wallet address.
              </Typography>

              <div className="flex flex-col gap-6">
                <MemberInfoForm />

                <AddMemberInput
                  error={formState.errors.inviteeIdentifier?.message}
                  inputProps={inviteeIdentifierInputProps}
                  onSelectAddress={handleSelectAddress}
                  value={inviteeIdentifierValue}
                />
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogActions
              className="px-6 pb-6"
              onCancel={onClose}
              cancelTestId="cancel-btn"
              confirmType="submit"
              confirmLabel="Add member"
              confirmTestId="add-member-modal-button"
              confirmDisabled={!formState.isValid}
              confirmLoading={isSubmitting}
            />
          </form>
        </FormProvider>
      </div>
    </ModalDialog>
  )
}

export default AddMemberModal
