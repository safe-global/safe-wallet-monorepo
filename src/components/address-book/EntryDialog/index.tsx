import { type ReactElement, type BaseSyntheticEvent, useMemo, useEffect, useState } from 'react'
import { Box, Button, DialogActions, DialogContent, Typography } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'

import AddressInput from '@/components/common/AddressInput'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import useChainId from '@/hooks/useChainId'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntry } from '@/store/addressBookSlice'
import madProps from '@/utils/mad-props'
import { isValidAddress } from '@/utils/validation'
import { useSuperChainAccountSubgraph } from '@/hooks/super-chain/useSuperChainAccountSubgraph'
import { Address } from 'viem'
import NounsAvatar from '@/components/common/NounsAvatar'
import { isValid } from 'date-fns'
import { type } from 'os'
import { upsertContact } from '@/store/contactsSlice'

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
  chainId,
  currentChainId,
}: {
  handleClose: () => void
  defaultValues?: AddressEntry
  disableAddressInput?: boolean
  chainId?: string
  currentChainId: string
}): ReactElement {
  const dispatch = useAppDispatch()
  const [currentUser, setCurrentUser] = useState<Address | null>(null)

  const { data, loading, error } = useSuperChainAccountSubgraph(currentUser)

  const methods = useForm<AddressEntry>({
    defaultValues,
    mode: 'onChange',
  })

  const { handleSubmit, formState, watch } = methods
  const watchedAddress = watch('address')
  useEffect(() => {
    if (isValidAddress(watchedAddress)) {
      setCurrentUser(watchedAddress as Address)
    } else {
      setCurrentUser(null)
    }
  }, [watchedAddress])

  const submitCallback = handleSubmit((newData: AddressEntry) => {
    dispatch(
      upsertAddressBookEntry({
        ...newData,
        chainId: chainId || currentChainId,
      }),
    )
    dispatch(
      upsertContact({
        ...newData,
        chainId: chainId || currentChainId,
        superChainAccount: data?.superChainSmartAccount
          ? {
            id: data.superChainSmartAccount.superChainId,
            nounSeed: {
              accessory: parseInt(data.superChainSmartAccount.noun_accessory),
              background: parseInt(data.superChainSmartAccount.noun_background),
              body: parseInt(data.superChainSmartAccount.noun_body),
              glasses: parseInt(data.superChainSmartAccount.noun_glasses),
              head: parseInt(data.superChainSmartAccount.noun_head),
            },
          }
          : undefined,
      }),
    )

    handleClose()
  })

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    submitCallback(e)
  }

  return (
    <ModalDialog
      open
      hideChainIndicator
      dialogTitle={
        defaultValues.name ? (
          'Edit entry'
        ) : (
          <Typography padding="8px" fontWeight={600} fontSize={24}>
            Create contact
          </Typography>
        )
      }
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
                label="Contact"
                noAvatar
                variant="outlined"
                fullWidth
                required
                disabled={disableAddressInput}
              />
            </Box>
            {!loading && !error && data?.superChainSmartAccount && (
              <Box paddingY="12px" display="flex" flexDirection="column" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Account found
                </Typography>
                <Box display="flex" gap={2} justifyContent="flex-start" alignItems="center">
                  <Box height="42px" width="42px" borderRadius="6px">
                    <NounsAvatar
                      seed={{
                        accessory: parseInt(data.superChainSmartAccount.noun_accessory),
                        background: parseInt(data.superChainSmartAccount.noun_background),
                        body: parseInt(data.superChainSmartAccount.noun_body),
                        glasses: parseInt(data.superChainSmartAccount.noun_glasses),
                        head: parseInt(data.superChainSmartAccount.noun_head),
                      }}
                    />
                  </Box>
                  <Typography fontSize={16}>{data.superChainSmartAccount.superChainId}</Typography>
                </Box>
              </Box>
            )}
            <Box mt={2} display="flex" width="100%" gap={2}>
              <Button fullWidth data-testid="cancel-btn" variant="contained" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                fullWidth
                data-testid="save-btn"
                type="submit"
                variant="contained"
                disabled={!formState.isValid || loading}
                disableElevation
                color="secondary"
              >
                Save
              </Button>
            </Box>
          </DialogContent>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default madProps(EntryDialog, {
  currentChainId: useChainId,
})
