import AddressBookInput from '@/components/common/AddressBookInput'
import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import NameInput from '@/components/common/NameInput'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { signProposerData, signProposerTypedData } from '@/features/proposers/utils/utils'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useAppDispatch } from '@/store'
import { useAddProposerMutation } from '@/store/api/gateway'
import { showNotification } from '@/store/notificationsSlice'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { addressIsNotCurrentSafe } from '@safe-global/utils/utils/validation'
import { isEthSignWallet } from '@/utils/wallets'
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
import type { Delegate } from '@safe-global/safe-gateway-typescript-sdk/dist/types/delegates'
import { type BaseSyntheticEvent, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

type UpsertProposerProps = {
  onClose: () => void
  onSuccess: () => void
  proposer?: Delegate
}

enum ProposerEntryFields {
  address = 'address',
  name = 'name',
}

type ProposerEntry = {
  [ProposerEntryFields.name]: string
  [ProposerEntryFields.address]: string
}

const UpsertProposer = ({ onClose, onSuccess, proposer }: UpsertProposerProps) => {
  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [addProposer] = useAddProposerMutation()
  const dispatch = useAppDispatch()

  const chainId = useChainId()
  const wallet = useWallet()
  const safeAddress = useSafeAddress()

  const methods = useForm<ProposerEntry>({
    defaultValues: {
      [ProposerEntryFields.address]: proposer?.delegate,
      [ProposerEntryFields.name]: proposer?.label,
    },
    mode: 'onChange',
  })

  const notCurrentSafe = addressIsNotCurrentSafe(safeAddress, 'Cannot add Safe Account itself as proposer')

  const { handleSubmit, formState } = methods

  const onConfirm = handleSubmit(async (data: ProposerEntry) => {
    if (!wallet) return

    setError(undefined)
    setIsLoading(true)

    try {
      const shouldEthSign = isEthSignWallet(wallet)
      const signer = await getAssertedChainSigner(wallet.provider)
      const signature = shouldEthSign
        ? await signProposerData(data.address, signer)
        : await signProposerTypedData(chainId, data.address, signer)

      await addProposer({
        chainId,
        delegator: wallet.address,
        signature,
        label: data.name,
        delegate: data.address,
        safeAddress,
        shouldEthSign,
      })

      trackEvent(
        isEditing ? SETTINGS_EVENTS.PROPOSERS.SUBMIT_EDIT_PROPOSER : SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER,
      )

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
    trackEvent(
      isEditing ? SETTINGS_EVENTS.PROPOSERS.CANCEL_EDIT_PROPOSER : SETTINGS_EVENTS.PROPOSERS.CANCEL_ADD_PROPOSER,
    )
    onClose()
  }

  const isEditing = !!proposer
  const canEdit = wallet?.address === proposer?.delegator

  return (
    <Dialog open onClose={onCancel}>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogTitle>
            <Box data-testid="untrusted-token-warning" display="flex" alignItems="center">
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isEditing ? 'Edit' : 'Add'} proposer
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

            <Alert severity="info">Proposer’s name and address are publicly visible.</Alert>

            <Box my={2}>
              {isEditing ? (
                <Box mb={3}>
                  <EthHashInfo address={proposer?.delegate} showCopyButton hasExplorer shortAddress={false} />
                </Box>
              ) : (
                <AddressBookInput
                  name="address"
                  label="Address"
                  validate={notCurrentSafe}
                  variant="outlined"
                  fullWidth
                  required
                />
              )}
            </Box>

            <Box mb={2}>
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

            <CheckWallet checkNetwork={!isLoading} allowProposer={false}>
              {(isOk) => (
                <Button
                  data-testid="submit-proposer-btn"
                  size="small"
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!isOk || isLoading || (isEditing && !canEdit) || !formState.isValid}
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

export default UpsertProposer
