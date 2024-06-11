import { useState, type ReactElement, type SyntheticEvent } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import {
  Alert,
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
import { type Address } from 'viem'
import InviteSent from '@/public/images/common/invite-sent.svg'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { usePrivy } from '@privy-io/react-auth'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import useSafeAddress from '@/hooks/useSafeAddress'
import { type INITIAL_STATE } from '@/components/common/SuperChainEOAS'

type NewEOAEntry = {
  address: Address
}

enum Steps {
  firstStep = 'FIRST_STEP',
  secondStep = 'SECOND_STEP',
  loadingStep = 'LOADING_STEP',
  errorStep = 'ERROR_STEP',
}

const AddEOAModal = ({ context, onClose }: { context: typeof INITIAL_STATE; onClose: () => void }): ReactElement => {
  const router = useRouter()
  const { logout } = usePrivy()
  const { getSponsoredWriteableSuperChainSmartAccount, getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const SmartAccountAddres = useSafeAddress()

  const [step, setStep] = useState<Steps>(Steps.firstStep)
  const [isChecking, setIsChecking] = useState(false)
  const [addressHasSuperChainAccount, setAddressHasSuperChainAccount] = useState(false)

  const formMethods = useForm<NewEOAEntry>({
    mode: 'onChange',
  })
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = formMethods

  const checkSuperChainAccount = async (address: Address) => {
    setIsChecking(true)
    const superChainSmartAccountReadOnly = getReadOnlySuperChainSmartAccount()
    try {
      const hasAccount = await superChainSmartAccountReadOnly?.superChainAccount(address)
      setAddressHasSuperChainAccount(hasAccount)
    } catch (e) {
      console.error(e)
    } finally {
      setIsChecking(false)
    }
  }

  const onSubmit = async (data: NewEOAEntry) => {
    const superChainSmartAccountSponsored = getSponsoredWriteableSuperChainSmartAccount()
    try {
      setStep(Steps.loadingStep)
      await superChainSmartAccountSponsored?.write.populateAddOwner([SmartAccountAddres as Address, data.address])
      setStep(Steps.secondStep)
    } catch (e) {
      setStep(Steps.errorStep)
    }
  }
  const onFormSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSubmit(onSubmit)()
  }

  const onRedirectLogInScreen = async () => {
    await logout()
    router.push('/welcome')
  }

  if (step === Steps.secondStep)
    return (
      <Dialog className={css.claimModal} open={context.open} onClose={onClose}>
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
          <Button fullWidth variant="contained" color="background" onClick={onRedirectLogInScreen}>
            LogIn Screen
          </Button>

          <Button onClick={onClose} fullWidth variant="contained" color="primary" type="submit">
            Continue
          </Button>
        </Box>
      </Dialog>
    )

  return (
    <ModalDialog
      open={context.open}
      hideChainIndicator
      dialogTitle={step === Steps.firstStep ? 'Invite address to account' : ''}
      onClose={onClose}
    >
      <form onSubmit={onFormSubmit}>
        <DialogContent>
          {context.currentAmountOfPopulatedOwners >= 3 ? (
            <Alert
              style={{
                paddingTop: '24px',
              }}
              severity="error"
            >
              <Typography variant="body1">
                You cannot invite more than 2 addresses at once. Accept the invite on the other addresses or consider
                uninviting an address before continuing.
              </Typography>
            </Alert>
          ) : (
            <Stack spacing={1}>
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
                    onChange: async (e) => {
                      const address = e.target.value as Address
                      if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
                        await checkSuperChainAccount(address)
                      } else {
                        setIsChecking(false)
                        setAddressHasSuperChainAccount(false)
                      }
                    },
                  })}
                  error={!!errors.address}
                  helperText={errors.address ? errors.address.message : ''}
                />
              </FormControl>
              {addressHasSuperChainAccount && (
                <Alert severity="error">
                  This address is already connected to another Superchain Account. Try another address.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button fullWidth variant="contained" onClick={onClose}>
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            color="secondary"
            disabled={!isValid || isChecking || addressHasSuperChainAccount}
            type="submit"
          >
            Send
          </Button>
        </DialogActions>
      </form>
    </ModalDialog>
  )
}

export default AddEOAModal
