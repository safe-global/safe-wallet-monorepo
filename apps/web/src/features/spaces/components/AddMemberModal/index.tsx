import { type ReactElement, useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useDarkMode } from '@/hooks/useDarkMode'
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
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import {
  AddMemberModalView,
  RoleMenuItemView,
} from '@views/features/spaces/components/AddMemberModal/AddMemberModalView'

export const RoleMenuItem = ({
  role,
  hasDescription = false,
}: {
  role: MemberRole
  hasDescription?: boolean
}): ReactElement => <RoleMenuItemView isAdmin={role === MemberRole.ADMIN} hasDescription={hasDescription} />

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
      if (isElevationRequiredError(response.error)) return
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
    <FormProvider {...methods}>
      <AddMemberModalView
        onClose={onClose}
        isDarkMode={isDarkMode}
        onSubmit={onSubmit}
        memberInfoForm={<MemberInfoForm />}
        addMemberInput={
          <AddMemberInput
            error={formState.errors.inviteeIdentifier?.message}
            inputProps={inviteeIdentifierInputProps}
            onSelectAddress={handleSelectAddress}
            value={inviteeIdentifierValue}
          />
        }
        error={error}
        isValid={formState.isValid}
        isSubmitting={isSubmitting}
      />
    </FormProvider>
  )
}

export default AddMemberModal
