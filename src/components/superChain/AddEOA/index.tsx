import type { ReactElement, SyntheticEvent } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import { Button, DialogActions, DialogContent, FormControl, Grid, TextField } from '@mui/material'
import { useForm } from 'react-hook-form'
const AddEOAModal = ({ open, onClose }: { open: boolean; onClose: () => void }): ReactElement => {
  const formMethods = useForm<FormData>({
    mode: 'onChange',
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = formMethods

  const onSubmit = (data: FormData) => {
    // props.onSubmit({
    //   userNonce: data.userNonce,
    //   gasLimit: data.gasLimit ? BigInt(data.gasLimit) : undefined,
    //   maxFeePerGas: safeParseUnits(data.maxFeePerGas) ?? params.maxFeePerGas,
    //   maxPriorityFeePerGas: safeParseUnits(data.maxPriorityFeePerGas) ?? params.maxPriorityFeePerGas,
    // })
  }
  const onFormSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSubmit(onSubmit)()
  }
  return (
    <ModalDialog open={open} hideChainIndicator dialogTitle="Invite address to account" onClose={onClose}>
      <form onSubmit={onFormSubmit}>
        <DialogContent>
          <FormControl fullWidth>
            <TextField placeholder="oeth:" fullWidth label="Address" {...register} />
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button fullWidth variant="contained" onClick={onClose}>
            Cancel
          </Button>

          <Button fullWidth variant="contained" disabled type="submit">
            Send
          </Button>
        </DialogActions>
      </form>
    </ModalDialog>
  )
}

export default AddEOAModal
