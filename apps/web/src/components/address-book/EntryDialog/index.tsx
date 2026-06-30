import type { ReactElement, BaseSyntheticEvent } from 'react'
import { useMemo, useState } from 'react'
import { Box, Button, DialogActions, DialogContent, type SxProps, type Theme } from '@mui/material'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { isAddress } from 'ethers'

import AddressInput from '@/components/common/AddressInput'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import useChainId from '@/hooks/useChainId'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useChain } from '@/hooks/useChains'
import {
  useAddressSimilarityGate,
  AddressSimilarityWarning,
  SimilarAddressConfirmDialog,
} from '@/features/address-poisoning'

export type AddressEntry = {
  name: string
  address: string
}

function EntryDialog({
  handleClose,
  defaultValues = {
    name: '',
    address: '',
  },
  disableAddressInput = false,
  chainIds,
  currentChainId,
  sx,
}: {
  handleClose: () => void
  defaultValues?: AddressEntry
  disableAddressInput?: boolean
  chainIds?: string[]
  currentChainId?: string
  sx?: SxProps<Theme>
}): ReactElement {
  const chainId = useChainId()
  const actualChainId = currentChainId ?? chainId
  const currentChain = useChain(actualChainId)
  const dispatch = useAppDispatch()

  const methods = useForm<AddressEntry>({
    defaultValues,
    mode: 'onChange',
  })

  const { handleSubmit, formState } = methods

  // Mode A: warn (and gate) when the contact address being entered resembles a trusted anchor.
  const addressValue = useWatch({ control: methods.control, name: 'address' })
  const similarityCandidate = useMemo(() => {
    if (disableAddressInput) return undefined
    const raw = String(addressValue ?? '')
      .split(':')
      .pop()
    return raw && isAddress(raw) ? raw : undefined
  }, [disableAddressInput, addressValue])
  const similarityGate = useAddressSimilarityGate(similarityCandidate)
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  const submitCallback = handleSubmit((data: AddressEntry) => {
    dispatch(upsertAddressBookEntries({ ...data, chainIds: chainIds ?? [actualChainId] }))
    handleClose()
  })

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    submitCallback(e)
  }

  return (
    <ModalDialog
      data-testid="entry-dialog"
      open
      onClose={handleClose}
      dialogTitle={defaultValues.name ? 'Edit entry' : 'Create entry'}
      hideChainIndicator={chainIds && chainIds.length > 1}
      chainId={chainIds?.[0]}
      sx={sx}
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent>
            <Box mb={2}>
              <NameInput data-testid="name-input" label="Name" autoFocus name="name" required />
            </Box>

            <Box>
              <AddressInput
                name="address"
                label="Address"
                variant="outlined"
                fullWidth
                required
                disabled={disableAddressInput}
                chain={currentChain}
                showPrefix={!!currentChainId}
              />
            </Box>

            {similarityGate.match && (
              <Box mt={2}>
                <AddressSimilarityWarning match={similarityGate.match} onReview={() => setIsCompareOpen(true)} />
              </Box>
            )}

            {similarityGate.match && similarityCandidate && (
              <SimilarAddressConfirmDialog
                open={isCompareOpen}
                candidate={similarityCandidate}
                match={similarityGate.match}
                onConfirm={() => {
                  similarityGate.acknowledge()
                  setIsCompareOpen(false)
                }}
                onCancel={() => setIsCompareOpen(false)}
              />
            )}
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              data-testid="save-btn"
              type="submit"
              variant="contained"
              disabled={!formState.isValid || similarityGate.isBlocked}
              disableElevation
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default EntryDialog
