import { useState, type ReactElement, type BaseSyntheticEvent } from 'react'
import { Box, Button, Collapse, DialogActions, DialogContent, TextField, Typography } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { Interface } from 'ethers'

import AddressInput from '@/components/common/AddressInput'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import useChainId from '@/hooks/useChainId'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { upsertCustomAbi } from '@/store/customAbiSlice'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { useChain } from '@/hooks/useChains'
import { trackEvent } from '@/services/analytics'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'

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
}: {
  handleClose: () => void
  defaultValues?: AddressEntry
  disableAddressInput?: boolean
  chainIds?: string[]
  currentChainId?: string
}): ReactElement {
  const chainId = useChainId()
  const actualChainId = currentChainId ?? chainId
  const currentChain = useChain(actualChainId)
  const dispatch = useAppDispatch()
  const [abiValue, setAbiValue] = useState('')
  const [abiError, setAbiError] = useState<string>()
  const [showAbi, setShowAbi] = useState(false)

  const methods = useForm<AddressEntry>({
    defaultValues,
    mode: 'onChange',
  })

  const { handleSubmit, formState } = methods

  const submitCallback = handleSubmit((data: AddressEntry) => {
    const targetChainIds = chainIds ?? [actualChainId]
    dispatch(upsertAddressBookEntries({ ...data, chainIds: targetChainIds }))

    if (abiValue.trim()) {
      try {
        new Interface(abiValue)
        const address = checksumAddress(data.address)
        targetChainIds.forEach((cId) => {
          dispatch(upsertCustomAbi({ chainId: cId, entry: { address, name: data.name, abi: abiValue.trim() } }))
        })
        trackEvent(SETTINGS_EVENTS.CUSTOM_ABIS.ADD)
      } catch {
        setAbiError('Invalid ABI format')
        return
      }
    }

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

            <Box mt={2}>
              <Typography
                variant="body2"
                color="primary"
                onClick={() => setShowAbi(!showAbi)}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
              >
                {showAbi ? '- Hide custom ABI' : '+ Add custom ABI (optional)'}
              </Typography>

              <Collapse in={showAbi}>
                <Box mt={1}>
                  <TextField
                    label="Contract ABI"
                    value={abiValue}
                    onChange={(e) => {
                      setAbiValue(e.target.value)
                      setAbiError(undefined)
                    }}
                    error={!!abiError}
                    helperText={abiError || 'Paste the contract ABI JSON to decode transaction data'}
                    multiline
                    minRows={3}
                    maxRows={8}
                    fullWidth
                  />
                </Box>
              </Collapse>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              data-testid="save-btn"
              type="submit"
              variant="contained"
              disabled={!formState.isValid}
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
