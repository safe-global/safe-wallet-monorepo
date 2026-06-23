import EthHashInfo from '@/components/common/EthHashInfo'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@safe-global/utils/validation/names'
import Track from '@/components/common/Track'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { useAppDispatch } from '@/store'
import EditIcon from '@/public/images/common/edit.svg'
import { Box, Button, DialogActions, DialogContent, IconButton, Tooltip, SvgIcon } from '@mui/material'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'

type EditOwnerValues = {
  name: string
}

export const EditOwnerDialog = ({ chainId, address, name }: { chainId: string; address: string; name?: string }) => {
  const [open, setOpen] = useState(false)

  const dispatch = useAppDispatch()

  const handleClose = () => setOpen(false)

  const onSubmit = (data: EditOwnerValues) => {
    if (data.name !== name) {
      dispatch(
        upsertAddressBookEntries({
          chainIds: [chainId],
          address,
          name: data.name,
        }),
      )
      handleClose()
    }
  }

  const formMethods = useForm<EditOwnerValues>({
    defaultValues: {
      name: name || '',
    },
    mode: 'onChange',
  })

  const { handleSubmit, formState, watch } = formMethods

  const nameValue = watch('name')

  const buttonDisabled = !formState.isValid || nameValue === name || nameValue === ''

  return (
    <>
      <Track {...SETTINGS_EVENTS.SETUP.EDIT_OWNER}>
        <Tooltip title="Edit signer">
          <span>
            <IconButton onClick={() => setOpen(true)} size="small">
              <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Track>

      <ModalDialog open={open} onClose={handleClose} dialogTitle="Edit signer name">
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Box py={2}>
                <NameInput
                  label="Signer name"
                  name="name"
                  required
                  minLength={NAME_MIN_LENGTH}
                  maxLength={ADDRESS_BOOK_NAME_MAX_LENGTH}
                />
              </Box>

              <Box py={2}>
                <EthHashInfo address={address} showCopyButton shortAddress={false} />
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={buttonDisabled}>
                Save
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </ModalDialog>
    </>
  )
}
