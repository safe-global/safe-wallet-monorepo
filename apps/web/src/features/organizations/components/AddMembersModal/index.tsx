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
import memberIcon from '@/public/images/orgs/member.svg'
import adminIcon from '@/public/images/orgs/admin.svg'
import AddressInput from '@/components/common/AddressInput'
import CheckIcon from '@mui/icons-material/Check'
import css from './styles.module.css'
import { useUserOrganizationsInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from '../../hooks/useCurrentOrgId'
import NameInput from '@/components/common/NameInput'

export enum MemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

type MemberField = {
  name: string
  address: string
  role: MemberRole
}

const RoleMenuItem = ({
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
              {isAdmin
                ? 'Admins can create and delete organizations, invite members, and more.'
                : 'Can view the organization data.'}
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
  const orgId = useCurrentOrgId()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteMembers] = useUserOrganizationsInviteUserV1Mutation()

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
    if (!orgId) {
      setError('Something went wrong. Please try again.')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await inviteMembers({
        orgId: Number(orgId),
        inviteUsersDto: { users: [{ address: data.address, role: data.role }] },
      })
      if (response.data) {
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
              Invite a signer of the Safe Accounts, or any other wallet address. Anyone in the organization can see
              their name.
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

              <AddressInput name="address" label="Address" required />
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
