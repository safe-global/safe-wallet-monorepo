import ModalDialog from '@/components/common/ModalDialog'
import type { ADD_EOA_INITIAL_STATE } from '@/components/common/SuperChainEOAS'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import { Alert, DialogContent, FormControl, Stack, TextField, Typography, Button, DialogActions } from '@mui/material'
import React, { SyntheticEvent, useState } from 'react'
import { useForm } from 'react-hook-form'
import { type Address, zeroAddress } from 'viem'
import type { NewEOAEntry } from '../..'

function AddEOA({
  onSubmit,
  onClose,
  context,
}: {
  onSubmit: (data: NewEOAEntry) => Promise<void>
  onClose: () => void
  context: typeof ADD_EOA_INITIAL_STATE
}) {
  const [isChecking, setIsChecking] = useState(false)
  const [addressHasSuperChainAccount, setAddressHasSuperChainAccount] = useState(false)
  const { getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const formMethods = useForm<NewEOAEntry>({
    mode: 'onChange',
  })
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = formMethods

  const checkSuperChainAccount = async (address: Address) => {
    setIsChecking(true)
    const superChainSmartAccountReadOnly = getReadOnlySuperChainSmartAccount()
    try {
      const hasAccount = await superChainSmartAccountReadOnly?.superChainAccount(address)
      setAddressHasSuperChainAccount(hasAccount.smartAccount !== zeroAddress)
    } catch (e) {
      console.error(e)
    } finally {
      setIsChecking(false)
    }
  }

  const onFormSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSubmit(onSubmit)()
  }

  return (
    <ModalDialog open={context.open} hideChainIndicator dialogTitle="Invite address to account" onClose={onClose}>
      <form onSubmit={onFormSubmit}>
        <DialogContent>
          {context.currentAmountOfPopulatedOwners >= 3 ? (
            <Alert
              style={{
                paddingTop: '24px',
              }}
              severity="error"
            >
              <Typography variant="body1">
                You cannot invite more than 2 addresses at once. Accept the invite on the other addresses or consider
                uninviting an address before continuing.
              </Typography>
            </Alert>
          ) : (
            <Stack spacing={1}>
              <FormControl fullWidth>
                <TextField
                  placeholder="oeth:"
                  fullWidth
                  label="Address"
                  {...register('address', {
                    required: 'Address is required',
                    pattern: {
                      value: /^0x[a-fA-F0-9]{40}$/,
                      message: 'Invalid Ethereum address',
                    },
                    onChange: async (e) => {
                      const address = e.target.value as Address
                      if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
                        await checkSuperChainAccount(address)
                      } else {
                        setIsChecking(false)
                        setAddressHasSuperChainAccount(false)
                      }
                    },
                  })}
                  error={!!errors.address}
                  helperText={errors.address ? errors.address.message : ''}
                />
              </FormControl>
              {addressHasSuperChainAccount && (
                <Alert severity="error">
                  This address is already connected to another Superchain Account. Try another address.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button fullWidth variant="contained" onClick={onClose}>
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            color="secondary"
            disabled={!isValid || isChecking || addressHasSuperChainAccount}
            type="submit"
          >
            Send
          </Button>
        </DialogActions>
      </form>
    </ModalDialog>
  )
}

export default AddEOA
