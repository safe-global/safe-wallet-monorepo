import { useOrganizationsCreateWithUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useRouter } from 'next/router'
import { type ReactElement, useState } from 'react'
import { Alert, Box, Button, CircularProgress, DialogActions, DialogContent, Typography } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import MUILink from '@mui/material/Link'
import Link from 'next/link'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import { AppRoutes } from '@/config/routes'

function OrgsCreationModal({ onClose }: { onClose: () => void }): ReactElement {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const methods = useForm<{ name: string }>({ mode: 'onChange' })
  const [createOrgWithUser] = useOrganizationsCreateWithUserV1Mutation()
  const { handleSubmit, formState } = methods

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    try {
      setIsSubmitting(true)
      const response = await createOrgWithUser({ createOrganizationDto: { name: data.name } })

      if (response.data) {
        router.push({ pathname: AppRoutes.organizations.index(response.data.id.toString()) })
        onClose()
      }

      if (response.error) {
        setError('Failed creating the organization. Please try again.')
      }
    } catch (e) {
      // TODO: Handle this error case
      console.log(e)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog
      open
      onClose={onClose}
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
            <Button type="submit" variant="contained" disabled={!formState.isValid} disableElevation>
              {isSubmitting ? <CircularProgress size={20} /> : 'Create organization'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default OrgsCreationModal
