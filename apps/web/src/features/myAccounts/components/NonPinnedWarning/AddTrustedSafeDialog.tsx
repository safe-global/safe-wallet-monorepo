import { useEffect } from 'react'
import { DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EthHashInfo from '@/components/common/EthHashInfo'
import NameInput from '@/components/common/NameInput'
import SimilarAddressAlert from './SimilarAddressAlert'
import type { SimilarAddressInfo } from '../../hooks/useNonPinnedSafeWarning.types'

interface AddTrustedSafeDialogProps {
  open: boolean
  safeAddress: string
  safeName?: string
  chainId: string
  hasSimilarAddress: boolean
  similarAddresses: SimilarAddressInfo[]
  onConfirm: (name: string) => void
  onCancel: () => void
}

interface FormData {
  name: string
}

/**
 * Confirmation dialog for adding a safe to the trusted list
 * Shows enhanced warning if similar addresses are detected
 */
const AddTrustedSafeDialog = ({
  open,
  safeAddress,
  safeName,
  hasSimilarAddress,
  similarAddresses,
  onConfirm,
  onCancel,
}: AddTrustedSafeDialogProps) => {
  const methods = useForm<FormData>({
    defaultValues: {
      name: safeName || '',
    },
    mode: 'onChange',
  })

  const { handleSubmit, formState, reset } = methods

  // Reset form when the target Safe changes so stale names aren't submitted
  useEffect(() => {
    reset({ name: safeName || '' })
  }, [safeName, safeAddress, reset])

  const onSubmit = handleSubmit((data: FormData) => {
    onConfirm(data.name.trim() || '')
  })

  return (
    <ModalDialog
      open={open}
      maxWidth="sm"
      fullWidth
      data-testid="add-trusted-safe-dialog"
      dialogTitle="Confirm trusted Safe"
      hideChainIndicator
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent>
            {hasSimilarAddress && <SimilarAddressAlert similarAddresses={similarAddresses} />}

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Safe to add
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: hasSimilarAddress ? '2px solid' : '1px solid',
                  borderColor: 'border.light',
                }}
              >
                <EthHashInfo address={safeAddress} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
              </Box>
            </Box>

            {!hasSimilarAddress && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review the full address above. Continue only if you recognize this Safe and want to add it to your
                trusted list.
              </Typography>
            )}

            <Box sx={{ mb: 2 }}>
              <NameInput
                data-testid="safe-name-input"
                name="name"
                label="Safe name"
                placeholder="Enter a name for this Safe"
                autoFocus
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={onCancel} variant="text">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              data-testid="confirm-add-trusted-safe-button"
              disabled={!formState.isValid}
              startIcon={hasSimilarAddress ? <WarningAmberIcon color="warning" /> : undefined}
            >
              {hasSimilarAddress ? 'I understand, add anyway' : 'Confirm'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default AddTrustedSafeDialog
