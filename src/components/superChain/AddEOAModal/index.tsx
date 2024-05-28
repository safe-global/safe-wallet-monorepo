import { useState, type ReactElement, type SyntheticEvent } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import type { Address } from 'viem'
import InviteSent from '@/public/images/common/invite-sent.svg'
import css from './styles.module.css'

type NewEOAEntry = {
  address: Address
}

enum Steps {
  firstStep = 'FIRST_STEP',
  secondStep = 'SECOND_STEP',
}

const AddEOAModal = ({ open, onClose }: { open: boolean; onClose: () => void }): ReactElement => {
  const [step, setStep] = useState<Steps>(Steps.firstStep)
  const formMethods = useForm<NewEOAEntry>({
    mode: 'onChange',
  })
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = formMethods

  const onSubmit = (data: NewEOAEntry) => {
    // dummyFunc
    setStep(Steps.secondStep)
  }
  const onFormSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSubmit(onSubmit)()
  }

  if (step === Steps.secondStep)
    return (
      <Dialog className={css.claimModal} open={open} onClose={onClose}>
        <DialogContent>
          <Stack justifyContent="center" alignItems="center" gap="24px" padding="36px 24px 36px 24px">
            <Box fontSize={56} height={47} width={55}>
              <SvgIcon component={InviteSent} inheritViewBox fontSize="inherit" />
            </Box>
            <Typography fontWeight={600} fontSize={24} align="center">
              Invite sent!
            </Typography>
            <Typography fontWeight={400} fontSize={16} color="text.secondary" variant="body1" align="center">
              You can find the invite on the login screen on the invited address{' '}
            </Typography>
          </Stack>
        </DialogContent>
        <Box display="flex" flexDirection="row" className={css.outsideActions}>
          <Button fullWidth variant="contained" color="background" onClick={onClose}>
            LogIn Screen
          </Button>

          <Button fullWidth variant="contained" color="primary" type="submit">
            Continue
          </Button>
        </Box>
      </Dialog>
    )

  return (
    <ModalDialog
      open={open}
      hideChainIndicator
      dialogTitle={step === Steps.firstStep ? 'Invite address to account' : ''}
      onClose={onClose}
    >
      <form onSubmit={onFormSubmit}>
        <DialogContent>
          <FormControl fullWidth>
            <TextField
              placeholder="oeth:"
              fullWidth
              label="Address"
              {...register('address', {
                required: 'Address is required',
                pattern: {
                  value: /^0x[a-fA-F0-9]{40}$/,
                  message: 'Invalid Ethereum address',
                },
              })}
              error={!!errors.address}
              helperText={errors.address ? errors.address.message : ''}
            />
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button fullWidth variant="contained" onClick={onClose}>
            Cancel
          </Button>

          <Button fullWidth variant="contained" color="secondary" disabled={!isValid} type="submit">
            Send
          </Button>
        </DialogActions>
      </form>
    </ModalDialog>
  )
}

export default AddEOAModal
