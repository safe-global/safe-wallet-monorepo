import AddressInput from '@/components/common/AddressInput'
import CheckWallet from '@/components/common/CheckWallet'
import NameInput from '@/components/common/NameInput'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { getDelegateTypedData } from '@/features/proposers/utils/utils'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useAppDispatch } from '@/store'
import { useAddDelegateMutation } from '@/store/api/gateway'
import { showNotification } from '@/store/notificationsSlice'
import { shortenAddress } from '@/utils/formatters'
import { signTypedData } from '@/utils/web3'
import { Close } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material'
import { type BaseSyntheticEvent, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

type AddProposerProps = {
  onClose: () => void
  onSuccess: () => void
}

enum DelegateEntryFields {
  address = 'address',
  name = 'name',
}

type DelegateEntry = {
  [DelegateEntryFields.name]: string
  [DelegateEntryFields.address]: string
}

const AddProposer = ({ onClose, onSuccess }: AddProposerProps) => {
  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [addDelegate] = useAddDelegateMutation()
  const dispatch = useAppDispatch()

  const chainId = useChainId()
  const wallet = useWallet()
  const safeAddress = useSafeAddress()

  const methods = useForm<DelegateEntry>({
    defaultValues: {
      [DelegateEntryFields.address]: '',
      [DelegateEntryFields.name]: '',
    },
    mode: 'onChange',
  })

  const { handleSubmit } = methods

  const onConfirm = handleSubmit(async (data: DelegateEntry) => {
    if (!wallet) return

    setError(undefined)
    setIsLoading(true)

    try {
      const signer = await getAssertedChainSigner(wallet.provider)
      const typedData = getDelegateTypedData(chainId, data.address)
      const signature = await signTypedData(signer, typedData)

      await addDelegate({
        chainId,
        delegator: wallet.address,
        signature,
        label: data.name,
        delegate: data.address,
        safeAddress,
      })

      trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER)

      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'add-proposer-success',
          title: 'Proposer added successfully!',
          message: `${shortenAddress(data.address)} can now suggest transactions for this account.`,
        }),
      )
    } catch (error) {
      setIsLoading(false)
      setError(error as Error)
      return
    }

    setIsLoading(false)
    onSuccess()
  })

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    onConfirm(e)
  }

  const onCancel = () => {
    trackEvent(SETTINGS_EVENTS.PROPOSERS.CANCEL_ADD_PROPOSER)
    onClose()
  }

  return (
    <Dialog open onClose={onCancel}>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogTitle>
            <Box data-testid="untrusted-token-warning" display="flex" alignItems="center">
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Add proposer
              </Typography>

              <Box flexGrow={1} />

              <IconButton aria-label="close" onClick={onCancel} sx={{ marginLeft: 'auto' }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <Divider />

          <DialogContent>
            <Box mb={2}>
              <Typography variant="body2">
                You&apos;re about to grant this address the ability to propose transactions. To complete the setup,
                confirm with a signature from your connected wallet.
              </Typography>
            </Box>

            <Alert severity="info">Proposer’s name and address will be publicly visible.</Alert>

            <Box my={2}>
              <AddressInput name="address" label="Address" variant="outlined" fullWidth required />
            </Box>

            <Box>
              <NameInput name="name" label="Name" required />
            </Box>

            {error && (
              <Box mt={2}>
                <ErrorMessage error={error}>Error adding proposer</ErrorMessage>
              </Box>
            )}

            <NetworkWarning action="sign" />
          </DialogContent>

          <Divider />

          <DialogActions sx={{ padding: 3, justifyContent: 'space-between' }}>
            <Button size="small" variant="text" onClick={onCancel}>
              Cancel
            </Button>

            <CheckWallet checkNetwork={!isLoading}>
              {(isOk) => (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!isOk || isLoading}
                  sx={{ minWidth: '122px', minHeight: '36px' }}
                >
                  {isLoading ? <CircularProgress size={20} /> : 'Continue'}
                </Button>
              )}
            </CheckWallet>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  )
}

export default AddProposer
