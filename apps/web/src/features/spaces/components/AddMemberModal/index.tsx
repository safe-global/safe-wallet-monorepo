import { type ReactElement, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import memberIcon from '@/public/images/spaces/member.svg'
import adminIcon from '@/public/images/spaces/admin.svg'
import CheckIcon from '@mui/icons-material/Check'
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
import { isAddress } from 'viem'
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
  selected = false,
}: {
  role: MemberRole
  hasDescription?: boolean
  selected?: boolean
}): ReactElement => {
  const isAdmin = role === MemberRole.ADMIN

  return (
    <Box width="100%" alignItems="center" className={css.roleMenuItem}>
      <Box className={css.roleIcon}>
        <SvgIcon mr={1} component={isAdmin ? adminIcon : memberIcon} inheritViewBox fontSize="small" />
      </Box>
      <Typography gridArea="title" fontWeight={hasDescription ? 'bold' : undefined}>
        {isAdmin ? 'Admin' : 'Member'}
      </Typography>
      {hasDescription && (
        <>
          <Box className={css.roleDescription}>
            <Typography variant="body2">
              {isAdmin ? 'Admins can create and delete spaces, invite members, and more.' : 'Can view the space data.'}
            </Typography>
          </Box>
          <Box className={selected ? css.roleCheckIcon : css.roleCheckIconHidden}>
            <CheckIcon fontSize="small" className={css.roleCheckSvg} />
          </Box>
        </>
      )}
    </Box>
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
    if (!isAddress(inviteeIdentifierValue, { strict: false })) {
      return
    }

    const addressBookName = addressBook[inviteeIdentifierValue]
    if (addressBookName) {
      setValue('name', addressBookName, { shouldValidate: true })
    }
  }, [addressBook, inviteeIdentifierValue, setValue])

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
        spaceId: Number(spaceId),
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
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ overflow: 'visible', py: 2 }}>
            <Typography mb={2}>Invite a member by email or wallet address.</Typography>

            <Stack spacing={3}>
              <MemberInfoForm />

              <AddMemberInput
                error={formState.errors.inviteeIdentifier?.message}
                inputProps={inviteeIdentifierInputProps}
                onSelectAddress={(address, name) => {
                  setValue('inviteeIdentifier', address, { shouldValidate: true })
                  setValue('name', name, { shouldValidate: true })
                }}
                value={inviteeIdentifierValue}
              />
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={onClose}>
              Cancel
            </Button>
            <Button
              data-testid="add-member-modal-button"
              type="submit"
              variant="contained"
              disabled={!formState.isValid || isSubmitting}
              disableElevation
            >
              {isSubmitting ? <CircularProgress size={20} /> : 'Add member'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default AddMemberModal
