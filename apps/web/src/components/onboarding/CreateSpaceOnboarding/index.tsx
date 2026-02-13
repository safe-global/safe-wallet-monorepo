import { useEffect, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { FormProvider, useForm } from 'react-hook-form'
import { Alert, Box, Button, CircularProgress, Paper, SvgIcon, Typography } from '@mui/material'
import { useSpacesCreateWithUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SpaceIcon from '@/public/images/spaces/space.svg'
import NameInput from '@/components/common/NameInput'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated, setLastUsedSpace } from '@/store/authSlice'
import useWallet, { useWalletContext } from '@/hooks/wallets/useWallet'
import ExternalLink from '@/components/common/ExternalLink'

const CreateSpaceOnboarding = (): ReactElement => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const walletContext = useWalletContext()
  const isWalletReady = walletContext?.isReady ?? false
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const methods = useForm<{ name: string }>({ mode: 'onChange' })
  const [createSpaceWithUser] = useSpacesCreateWithUserV1Mutation()
  const { handleSubmit, formState } = methods

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if(!isWalletReady) return
    
    if (!wallet || !isUserAuthenticated) {
      router.replace({ pathname: AppRoutes.welcome.index })
    }
  }, [wallet, isUserAuthenticated, router, isWalletReady])

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    try {
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.CREATE_SPACE })
      const response = await createSpaceWithUser({ createSpaceDto: { name: data.name } })

      if (response.data) {
        const spaceId = response.data.id.toString()

        dispatch(setLastUsedSpace(spaceId))

        dispatch(
          showNotification({
            message: `Created space with name ${data.name}.`,
            variant: 'success',
            groupKey: 'create-space-success',
          }),
        )

        router.push({ pathname: AppRoutes.onboarding.selectSafes, query: { spaceId } })
      }

      if (response.error) {
        throw response.error
      }
    } catch (error) {
      // @ts-ignore
      const errorMessage = error?.data?.message || 'Failed creating the space. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  })

  if (!wallet || !isUserAuthenticated) {
    return <></>
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" p={3}>
      <Paper sx={{ maxWidth: 500, width: '100%', p: 4, textAlign: 'center' }}>
        <SvgIcon component={SpaceIcon} inheritViewBox sx={{ fill: 'none', fontSize: 48, mb: 2 }} />

        <Typography variant="h3" fontWeight={700} mb={1}>
          Create your space
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Spaces let you organize Safe Accounts, manage members, and share address books across your team.
        </Typography>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <Box mb={2} textAlign="left">
              <NameInput data-testid="space-name-input" label="Space name" autoFocus name="name" required />
            </Box>

            <Typography variant="body2" color="text.secondary" mb={2} textAlign="left">
              How is my data processed? Read our <ExternalLink href={AppRoutes.privacy}>privacy policy</ExternalLink>
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              data-testid="create-space-button"
              type="submit"
              variant="contained"
              disabled={!formState.isValid || isSubmitting}
              disableElevation
              fullWidth
              sx={{ minHeight: '42px' }}
            >
              {isSubmitting ? <CircularProgress size={20} /> : 'Create space'}
            </Button>
          </form>
        </FormProvider>
      </Paper>
    </Box>
  )
}

export default CreateSpaceOnboarding
