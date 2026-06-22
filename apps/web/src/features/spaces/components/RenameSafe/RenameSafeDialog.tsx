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
import { Controller, FormProvider, useForm } from 'react-hook-form'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'
import useChains from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { RenameTarget } from './types'

type FormValues = { name: string; networks: Chain[] }

export interface RenameSafeDialogProps {
  target: RenameTarget
  onClose: () => void
  /** Elevate the dialog above a parent modal (e.g. when opened from inside the Accounts modal). */
  sx?: SxProps<Theme>
}

const RenameSafeDialog = ({ target, onClose, sx }: RenameSafeDialogProps): ReactElement => {
  const dispatch = useAppDispatch()
  const { configs } = useChains()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [upsertSpaceAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  // The selector is scoped to the chains THIS Safe is on (not all Safe-supported chains),
  // and defaults to all of them; the user can narrow which of the Safe's chains the name applies to.
  const safeChains = target.chainIds
    .map((chainId) => (configs ?? []).find((chain) => chain.chainId === chainId))
    .filter((chain): chain is Chain => Boolean(chain))

  const methods = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { name: target.currentName, networks: safeChains },
  })
  const { handleSubmit, formState, control } = methods
  const { errors } = formState

  const onSubmit = handleSubmit(async ({ name, networks }) => {
    setError(undefined)
    const chainIds = networks.map((network) => network.chainId)
    const writeToSpace = target.isSpaceSafe && Boolean(target.spaceId)

    if (!writeToSpace) {
      dispatch(upsertAddressBookEntries({ name, address: target.address, chainIds }))
      onClose()
      return
    }

    try {
      setIsSubmitting(true)
      const result = await upsertSpaceAddressBook({
        spaceId: target.spaceId as string,
        upsertAddressBookItemsDto: { items: [{ name, address: target.address, chainIds }] },
      })
      if (result.error) {
        setError('Something went wrong. Please try again.')
        return
      }
      dispatch(showNotification({ message: 'Updated Safe name', variant: 'success', groupKey: 'rename-safe-success' }))
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
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

              {/* Only offer a chain picker when the Safe spans more than one chain. */}
              {safeChains.length > 1 && (
                <Controller
                  name="networks"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <NetworkMultiSelectorInput
                      name="networks"
                      showSelectAll
                      chains={safeChains}
                      value={field.value || []}
                      error={!!errors.networks}
                      helperText={errors.networks ? 'Select at least one network' : ''}
                    />
                  )}
                />
              )}
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
