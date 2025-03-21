import { type ReactElement, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  MenuItem,
  Select,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'
import { FormProvider, useForm, Controller } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import memberIcon from '@/public/images/spaces/member.svg'
import adminIcon from '@/public/images/spaces/admin.svg'
import AddressInput from '@/components/common/AddressInput'
import CheckIcon from '@mui/icons-material/Check'
import css from './styles.module.css'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from 'src/features/spaces/hooks/useCurrentSpaceId'
import NameInput from '@/components/common/NameInput'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

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

const AddMembersModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const router = useRouter()
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

  const { handleSubmit, formState, control } = methods

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
        onClose()
      }
      if (response.error) {
        setError('Invite failed. Please try again.')
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
              <Stack direction="row" spacing={2} alignItems="center">
                <NameInput name="name" label="Name" required />

                <Controller
                  control={control}
                  name="role"
                  defaultValue={MemberRole.MEMBER}
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

              <AddressInput name="address" label="Address" required showPrefix={false} />
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
            <Button type="submit" variant="contained" disabled={!formState.isValid} disableElevation>
              {isSubmitting ? <CircularProgress size={20} /> : 'Add member'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default AddMembersModal
