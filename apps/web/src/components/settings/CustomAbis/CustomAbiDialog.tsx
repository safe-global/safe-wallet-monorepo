import { useForm, Controller } from 'react-hook-form'
import { Button, DialogActions, DialogContent, TextField } from '@mui/material'
import { Interface, isAddress } from 'ethers'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import ModalDialog from '@/components/common/ModalDialog'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCustomAbiByAddress, upsertCustomAbi } from '@/store/customAbiSlice'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import useChainId from '@/hooks/useChainId'
import { trackEvent } from '@/services/analytics'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'

type FormData = {
  address: string
  name: string
  abi: string
}

const validateAbi = (value: string): string | true => {
  try {
    new Interface(value)
    return true
  } catch {
    return 'Invalid ABI format'
  }
}

type CustomAbiDialogProps = {
  onClose: () => void
  defaultAddress?: string
  defaultName?: string
}

const CustomAbiDialog = ({ onClose, defaultAddress, defaultName }: CustomAbiDialogProps) => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const existingAbi = useAppSelector((state) =>
    defaultAddress ? selectCustomAbiByAddress(state, chainId, defaultAddress) : null,
  )
  const isEditing = !!existingAbi

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      address: defaultAddress ?? '',
      name: defaultName ?? existingAbi?.name ?? '',
      abi: existingAbi?.abi ?? '',
    },
  })

  const onSubmit = handleSubmit((data) => {
    const address = checksumAddress(data.address)
    const name = data.name.trim()

    dispatch(
      upsertCustomAbi({
        chainId,
        entry: {
          address,
          name,
          abi: data.abi.trim(),
        },
      }),
    )

    dispatch(upsertAddressBookEntries({ chainIds: [chainId], address, name }))

    trackEvent(SETTINGS_EVENTS.CUSTOM_ABIS.ADD)
    onClose()
  })

  return (
    <ModalDialog open onClose={onClose} dialogTitle={isEditing ? 'Edit custom ABI' : 'Add custom ABI'}>
      <form onSubmit={onSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            name="address"
            control={control}
            rules={{
              required: 'Contract address is required',
              validate: (value) => (isAddress(value) ? true : 'Invalid Ethereum address'),
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contract address"
                error={!!errors.address}
                helperText={errors.address?.message}
                fullWidth
                disabled={!!defaultAddress}
              />
            )}
          />

          <Controller
            name="name"
            control={control}
            rules={{
              required: 'Name is required',
              validate: (value) => (value.trim() ? true : 'Name cannot be empty'),
            }}
            render={({ field }) => (
              <TextField {...field} label="Name" error={!!errors.name} helperText={errors.name?.message} fullWidth />
            )}
          />

          <Controller
            name="abi"
            control={control}
            rules={{
              required: 'ABI is required',
              validate: validateAbi,
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="ABI"
                error={!!errors.abi}
                helperText={errors.abi?.message}
                multiline
                minRows={4}
                maxRows={12}
                fullWidth
              />
            )}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!isValid}>
            Save
          </Button>
        </DialogActions>
      </form>
    </ModalDialog>
  )
}

export default CustomAbiDialog
