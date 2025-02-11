import type { ReactElement, BaseSyntheticEvent } from 'react'
import { Box, Button, DialogActions, DialogContent, Typography } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import MUILink from '@mui/material/Link'
import Link from 'next/link'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import { AppRoutes } from '@/config/routes'

function OrgsCreationModal({ handleClose }: { handleClose: () => void }): ReactElement {
  const methods = useForm<{ name: string }>({ mode: 'onChange' })
  const { handleSubmit, formState } = methods

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    handleSubmit((data) => {
      console.log(data)
      // TODO: create the organization
      handleClose()
    })
  }

  return (
    <ModalDialog
      open
      onClose={handleClose}
      dialogTitle={
        <>
          <AccountBalanceIcon sx={{ mr: 1 }} />
          Create organization
        </>
      }
      hideChainIndicator
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ py: 2 }}>
            <Box mb={2}>
              <NameInput data-testid="name-input" label="Name" autoFocus name="name" required />
            </Box>
            <Typography variant="body2" color="text.secondary">
              How is my data processed? Read our{' '}
              <Link href={AppRoutes.privacy} passHref legacyBehavior>
                <MUILink>privacy policy</MUILink>
              </Link>
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!formState.isValid} disableElevation>
              Create organization
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default OrgsCreationModal
