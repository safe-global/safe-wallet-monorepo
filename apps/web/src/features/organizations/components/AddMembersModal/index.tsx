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
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import memberIcon from '@/public/images/orgs/member.svg'
import adminIcon from '@/public/images/orgs/admin.svg'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { sameAddress } from '@/utils/addresses'
import AddressInput from '@/components/common/AddressInput'

enum Role {
  ADMIN = 'admin',
  MEMBER = 'member',
}

type MemberField = {
  address: string
  role: Role
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
  const { getValues } = useFormContext()

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
      <Select name={`members.${index}.role`} defaultValue={Role.MEMBER} required sx={{ minWidth: '150px' }}>
        <MenuItem value={Role.ADMIN}>
          <Stack direction="row" alignItems="center" spacing={1} padding={0.5}>
            <SvgIcon component={adminIcon} inheritViewBox fontSize="small" />
            <Typography>Admin</Typography>
          </Stack>
        </MenuItem>
        <MenuItem value={Role.MEMBER}>
          <Stack direction="row" alignItems="center" spacing={1} padding={0.5}>
            <SvgIcon component={memberIcon} inheritViewBox fontSize="small" />
            <Typography>Member</Typography>
          </Stack>
        </MenuItem>
      </Select>
      <Box sx={{ visibility: showRemoveButton ? 'visible' : 'hidden' }}>
        <IconButton onClick={onRemove} aria-label="Remove member" sx={{ p: 0, color: 'error.main' }}>
          <SvgIcon component={DeleteIcon} inheritViewBox />
        </IconButton>
      </Box>
    </Stack>
  )
}

const AddMembersModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const methods = useForm<AddMembersFormFields>({
    mode: 'onChange',
    defaultValues: {
      members: [
        {
          address: '',
          role: Role.MEMBER,
        },
      ],
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

    try {
      // TODO: handle sending member invites
      setIsSubmitting(true)
      console.log(data)
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
