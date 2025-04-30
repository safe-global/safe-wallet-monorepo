import AddressInput from '@/components/common/AddressInput'
import ChainIndicator from '@/components/common/ChainIndicator'
import ModalDialog from '@/components/common/ModalDialog'
import networkSelectorCss from '@/components/common/NetworkSelector/styles.module.css'
import chains from '@/config/chains'
import css from './styles.module.css'
import useChains from '@/hooks/useChains'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Button, DialogActions, DialogContent, MenuItem, Select, Stack, Box } from '@mui/material'
import { getSafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import React, { useCallback, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'

export type AddManuallyFormValues = {
  address: string
  chainId: string
}

const AddManually = ({ handleAddSafe }: { handleAddSafe: (data: AddManuallyFormValues) => void }) => {
  const [addManuallyOpen, setAddManuallyOpen] = useState(false)
  const { configs } = useChains()

  const formMethods = useForm<AddManuallyFormValues>({
    mode: 'onChange',
    defaultValues: {
      address: '',
      chainId: chains.eth,
    },
  })

  const { handleSubmit, watch, register, reset, formState } = formMethods

  const chainId = watch('chainId')
  const selectedChain = configs.find((chain) => chain.chainId === chainId)

  const onSubmit = handleSubmit((data) => {
    trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNT_MANUALLY })
    handleAddSafe(data)
    onClose()
  })

  const onClose = () => {
    reset()
    setAddManuallyOpen(false)
  }

  const validateSafeAddress = async (address: string) => {
    try {
      await getSafeInfo(chainId, address)
    } catch (error) {
      return 'Address given is not a valid Safe Account address'
    }
  }

  const renderMenuItem = useCallback(
    (chainId: string, isSelected: boolean) => {
      const chain = configs.find((chain) => chain.chainId === chainId)
      if (!chain) return null

      return (
        <MenuItem
          data-testid="network-item"
          key={chainId}
          value={chainId}
          sx={{ '&:hover': { backgroundColor: isSelected ? 'transparent' : 'inherit' } }}
          disableRipple={isSelected}
        >
          <ChainIndicator chainId={chainId} />
        </MenuItem>
      )
    },
    [configs],
  )

  const chainIdField = register('chainId')

  return (
    <>
      <Button data-testid="add-manually-button" size="compact" onClick={() => setAddManuallyOpen(true)}>
        + Add manually
      </Button>
      <ModalDialog
        open={addManuallyOpen}
        dialogTitle="Add safe account"
        onClose={onClose}
        hideChainIndicator
        PaperProps={{ sx: { maxWidth: '760px' } }}
      >
        <FormProvider {...formMethods}>
          <form
            onSubmit={(e) => {
              e.stopPropagation()
              return onSubmit(e)
            }}
          >
            <DialogContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <AddressInput
                  data-testid="add-address-input"
                  label="Safe Account"
                  chain={selectedChain}
                  validate={validateSafeAddress}
                  name="address"
                  deps={chainId}
                />
                <Box data-testid="network-selector" className={css.selectWrapper}>
                  <Select
                    {...chainIdField}
                    value={chainId}
                    size="small"
                    className={networkSelectorCss.select}
                    variant="standard"
                    sx={{ width: '100%' }}
                    IconComponent={ExpandMoreIcon}
                    renderValue={(value) => renderMenuItem(value, true)}
                    MenuProps={{
                      transitionDuration: 0,
                      slotProps: { paper: { sx: { overflow: 'auto' } } },
                    }}
                  >
                    {configs.map((chain) => renderMenuItem(chain.chainId, false))}
                  </Select>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                data-testid="add-space-account-manually-button"
                variant="contained"
                disabled={!formState.isValid}
                type="submit"
              >
                Add
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </ModalDialog>
    </>
  )
}

export default AddManually
