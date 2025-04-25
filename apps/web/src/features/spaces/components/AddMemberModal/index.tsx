import { type ReactElement, useState } from 'react'
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
import AddressInput from '@/components/common/AddressInput'
import CheckIcon from '@mui/icons-material/Check'
import css from './styles.module.css'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from 'src/features/spaces/hooks/useCurrentSpaceId'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import MemberInfoForm from '@/features/spaces/components/AddMemberModal/MemberInfoForm'

type MemberField = {
  name: string
  address: string
  role: MemberRole
}

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
      <Box sx={{ gridArea: 'icon', display: 'flex', alignItems: 'center' }}>
        <SvgIcon mr={1} component={isAdmin ? adminIcon : memberIcon} inheritViewBox fontSize="small" />
      </Box>
      <Typography gridArea="title" fontWeight={hasDescription ? 'bold' : undefined}>
        {isAdmin ? 'Admin' : 'Member'}
      </Typography>
      {hasDescription && (
        <>
          <Box gridArea="description">
            <Typography variant="body2" sx={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
              {isAdmin ? 'Admins can create and delete spaces, invite members, and more.' : 'Can view the space data.'}
            </Typography>
          </Box>
          <Box gridArea="checkIcon" sx={{ visibility: selected ? 'visible' : 'hidden', mx: 1 }}>
            <CheckIcon fontSize="small" sx={{ color: 'text.primary' }} />
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

  const methods = useForm<MemberField>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      address: '',
      role: MemberRole.MEMBER,
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
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.ADD_MEMBER })
      const response = await inviteMembers({
        spaceId: Number(spaceId),
        inviteUsersDto: { users: [{ address: data.address, role: data.role, name: data.name }] },
      })

      if (response.data) {
        if (router.pathname !== AppRoutes.spaces.members) {
          router.push({ pathname: AppRoutes.spaces.members, query: { spaceId } })
        }

        dispatch(
          showNotification({
            message: `Invited ${data.name} to space`,
            variant: 'success',
            groupKey: 'invite-member-success',
          }),
        )

        onClose()
      }
      if (response.error) {
        // @ts-ignore
        const errorMessage = response.error?.data?.message || 'Invite failed. Please try again.'
        setError(errorMessage)
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
          <DialogContent sx={{ py: 2 }}>
            <Typography mb={2}>
              Invite a signer of the Safe Accounts, or any other wallet address. Anyone in the space can see their name.
            </Typography>

            <Stack spacing={3}>
              <MemberInfoForm />

              <AddressInput
                data-testid="member-address-input"
                name="address"
                label="Address"
                required
                showPrefix={false}
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
