import { type ReactElement, useCallback, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Select,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'
import { FormProvider, useFieldArray, useForm, useFormContext, Controller } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import memberIcon from '@/public/images/orgs/member.svg'
import adminIcon from '@/public/images/orgs/admin.svg'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { sameAddress } from '@/utils/addresses'
import AddressInput from '@/components/common/AddressInput'
import CheckIcon from '@mui/icons-material/Check'
import css from './styles.module.css'
import { useUserOrganizationsInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from '../../hooks/useCurrentOrgId'

enum Role {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

type MemberField = {
  address: string
  role: Role
}

const RoleMenuItem = ({
  role,
  hasDescription = false,
  selected = false,
}: {
  role: Role
  hasDescription?: boolean
  selected?: boolean
}): ReactElement => {
  const isAdmin = role === Role.ADMIN

  return (
    <Box width="100%" alignItems="center" className={css.roleMenuItem}>
      <SvgIcon mr={1} gridArea="icon" component={isAdmin ? adminIcon : memberIcon} inheritViewBox fontSize="small" />
      <Typography gridArea="title" fontWeight="bold">
        {isAdmin ? 'Admin' : 'Member'}
      </Typography>
      {hasDescription && (
        <>
          <Box gridArea="description">
            <Typography variant="body2" sx={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
              {isAdmin
                ? 'Admins can create and delete organizations, invite members and more.'
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

export type AddMembersFormFields = {
  members: MemberField[]
}

const MemberRow = ({
  index,
  onRemove,
  showRemoveButton,
}: {
  index: number
  onRemove: () => void
  showRemoveButton: boolean
}): ReactElement => {
  const { getValues, control } = useFormContext()

  const validateMemberAddress = useCallback(
    async (address: string) => {
      const members = getValues('members')
      if (members.filter((member: MemberField) => sameAddress(member.address, address)).length > 1) {
        return 'Address is already added'
      }
    },
    [getValues],
  )

  return (
    <Stack direction="row" spacing={2} alignItems="center" mt={3}>
      <Box my={2} sx={{ flex: 1, minWidth: 0 }}>
        <AddressInput validate={validateMemberAddress} name={`members.${index}.address`} label="Address" required />
      </Box>
      <Controller
        control={control}
        name={`members.${index}.role`}
        defaultValue={Role.MEMBER}
        render={({ field: { value, onChange, ...field } }) => (
          <Select
            {...field}
            value={value}
            onChange={onChange}
            required
            sx={{ minWidth: '150px', py: 0.5 }}
            renderValue={(val) => <RoleMenuItem role={val as Role} />}
          >
            <MenuItem value={Role.ADMIN}>
              <RoleMenuItem role={Role.ADMIN} hasDescription selected={value === Role.ADMIN} />
            </MenuItem>
            <MenuItem value={Role.MEMBER}>
              <RoleMenuItem role={Role.MEMBER} hasDescription selected={value === Role.MEMBER} />
            </MenuItem>
          </Select>
        )}
      />
      <Box sx={{ visibility: showRemoveButton ? 'visible' : 'hidden' }}>
        <IconButton onClick={onRemove} aria-label="Remove member" sx={{ p: 0, color: 'error.main' }}>
          <SvgIcon component={DeleteIcon} inheritViewBox />
        </IconButton>
      </Box>
    </Stack>
  )
}

const AddMembersModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const orgId = useCurrentOrgId()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteMembers] = useUserOrganizationsInviteUserV1Mutation()
  const methods = useForm<AddMembersFormFields>({
    mode: 'onChange',
    defaultValues: {
      members: [{ address: '', role: Role.MEMBER }],
    },
  })
  const { handleSubmit, formState, control } = methods

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  })

  const handleAddMember = () => {
    append({ address: '', role: Role.MEMBER })
  }

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
        body: data.members.map((member) => ({ address: member.address, role: member.role })),
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
    <ModalDialog open onClose={onClose} dialogTitle="Add members" hideChainIndicator>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ py: 2 }}>
            <Typography mb={4}>
              You can invite signers of the Safe Accounts in your organization, or any other wallet addresses.
            </Typography>

            {fields.map((field, index) => (
              <MemberRow
                key={field.id}
                index={index}
                onRemove={() => remove(index)}
                showRemoveButton={fields.length > 1}
              />
            ))}

            <Button
              sx={{ mt: 3, px: 1 }}
              variant="text"
              onClick={handleAddMember}
              startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
              size="small"
            >
              Add member
            </Button>

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
              {isSubmitting ? <CircularProgress size={20} /> : 'Add members'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default AddMembersModal
