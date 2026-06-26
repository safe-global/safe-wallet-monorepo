import { useState, type ReactElement } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  Stack,
  type SxProps,
  type Theme,
} from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import type { RenameTarget } from './types'

type FormValues = { name: string }

const GENERIC_ERROR = 'Something went wrong. Please try again.'
const SUCCESS_NOTIFICATION = {
  message: 'Updated Safe name',
  variant: 'success' as const,
  groupKey: 'rename-safe-success',
}

export interface RenameSafeDialogProps {
  target: RenameTarget
  onClose: () => void
  /** Elevate the dialog above a parent modal (e.g. when opened from inside the Accounts modal). */
  sx?: SxProps<Theme>
}

const RenameSafeDialog = ({ target, onClose, sx }: RenameSafeDialogProps): ReactElement => {
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [upsertSpaceAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()
  const { getFromSpaceByAddress } = useMergedAddressBooks()

  const methods = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { name: target.currentName },
  })
  const { handleSubmit, formState } = methods

  const onSubmit = handleSubmit(async ({ name }) => {
    setError(undefined)
    const { spaceId } = target

    if (!target.isSpaceSafe || !spaceId) {
      // Local: one name across networks — write it to ALL the Safe's chains.
      dispatch(upsertAddressBookEntries({ name, address: target.address, chainIds: target.chainIds }))
      dispatch(showNotification(SUCCESS_NOTIFICATION))
      onClose()
      return
    }

    // Space (cloud): the CGW row is keyed by (space, address) — one name. Only change the name and
    // PRESERVE the existing chain_ids (the upsert API replaces them, so re-send the row's current
    // set). A brand-new entry has none yet → use the Safe's chains.
    const chainIds = getFromSpaceByAddress(target.address)?.chainIds ?? target.chainIds
    try {
      setIsSubmitting(true)
      const result = await upsertSpaceAddressBook({
        spaceId,
        upsertAddressBookItemsDto: { items: [{ name, address: target.address, chainIds }] },
      })
      if (result.error) {
        setError(GENERIC_ERROR)
        return
      }
      dispatch(showNotification(SUCCESS_NOTIFICATION))
      onClose()
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog
      data-testid="rename-safe-dialog"
      open
      onClose={onClose}
      dialogTitle="Rename Safe Account"
      hideChainIndicator
      sx={sx}
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
              <AddressInputReadOnly address={target.address} chainId={target.chainIds[0]} />

              <NameInput data-testid="name-input" name="name" label="Name" autoFocus required />
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
              data-testid="save-btn"
              type="submit"
              variant="contained"
              disableElevation
              disabled={!formState.isValid || isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default RenameSafeDialog
