import { useSpacesCreateWithUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

function SpaceCreationModal({ onClose }: { onClose: () => void }): ReactElement {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const methods = useForm<{ name: string }>({ mode: 'onChange' })
  const [createSpaceWithUser] = useSpacesCreateWithUserV1Mutation()
  const { handleSubmit, formState } = methods

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    try {
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.CREATE_SPACE })
      const response = await createSpaceWithUser({ createSpaceDto: { name: data.name } })

      if (response.data) {
        const spaceId = response.data.id.toString()
        router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
        onClose()
      }

      if (response.error) {
        throw response.error
      }
    } catch (e) {
      // TODO: Show more specific error message
      setError('Failed creating the space. Please try again.')
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
          Create space
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
            <Button
              type="submit"
              variant="contained"
              disabled={!formState.isValid || isSubmitting}
              disableElevation
              sx={{ minWidth: '200px' }}
            >
              {isSubmitting ? <CircularProgress size={20} /> : 'Create space'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default SpaceCreationModal
