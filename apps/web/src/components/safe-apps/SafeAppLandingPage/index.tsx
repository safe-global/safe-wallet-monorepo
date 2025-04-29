import { useEffect } from 'react'
import { Box, CircularProgress, Paper, Grid2 as Grid } from '@mui/material'
import { OVERVIEW_EVENTS, SAFE_APPS_EVENTS, trackEvent, trackSafeAppEvent } from '@/services/analytics'
import { useSafeAppFromBackend } from '@/hooks/safe-apps/useSafeAppFromBackend'
import { useSafeAppFromManifest } from '@/hooks/safe-apps/useSafeAppFromManifest'
import { SafeAppDetails } from '@/components/safe-apps/SafeAppLandingPage/SafeAppDetails'
import { TryDemo } from '@/components/safe-apps/SafeAppLandingPage/TryDemo'
import { AppActions } from '@/components/safe-apps/SafeAppLandingPage/AppActions'
import useWallet from '@/hooks/wallets/useWallet'
import { AppRoutes } from '@/config/routes'
import { SAFE_APPS_DEMO_SAFE_MAINNET } from '@/config/constants'
import useOnboard from '@/hooks/wallets/useOnboard'
import { Errors, logError } from '@/services/exceptions'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

type Props = {
  appUrl: string
  chain: ChainInfo
}

const CHAIN_ID_WITH_A_DEMO = '1'

const SafeAppLanding = ({ appUrl, chain }: Props) => {
  const [backendApp, , backendAppLoading] = useSafeAppFromBackend(appUrl, chain.chainId)
  const { safeApp, isLoading } = useSafeAppFromManifest(appUrl, chain.chainId, backendApp)
  const wallet = useWallet()
  const onboard = useOnboard()
  // show demo if the app was shared for mainnet or we can find the mainnet chain id on the backend
  const showDemo = chain.chainId === CHAIN_ID_WITH_A_DEMO || !!backendApp?.chainIds.includes(CHAIN_ID_WITH_A_DEMO)

  useEffect(() => {
    if (!isLoading && !backendAppLoading && safeApp.chainIds.length) {
      const appName = backendApp ? backendApp.name : safeApp.url

      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.SHARED_APP_LANDING, label: chain.chainId }, appName)
    }
  }, [isLoading, backendApp, safeApp, backendAppLoading, chain])

  const handleConnectWallet = async () => {
    if (!onboard) return

    trackEvent(OVERVIEW_EVENTS.OPEN_ONBOARD)

    onboard.connectWallet().catch((e) => logError(Errors._107, e))
  }

  const handleDemoClick = () => {
    trackSafeAppEvent(SAFE_APPS_EVENTS.SHARED_APP_OPEN_DEMO, backendApp ? backendApp.name : appUrl)
  }

  if (isLoading || backendAppLoading) {
    return (
      <Box
        sx={{
          py: 4,
          textAlign: 'center',
        }}
      >
        <CircularProgress size={40} />
      </Box>
    )
  }

  return (
    <Grid container>
      <Grid size={{ sm: 12, md: 12, lg: 8, xl: 6 }} offset={{ lg: 2, xl: 3 }}>
        <Paper sx={{ p: 6 }}>
          <SafeAppDetails app={backendApp || safeApp} showDefaultListWarning={!backendApp} />
          <Grid container sx={{ mt: 4 }} rowSpacing={{ xs: 2, sm: 2 }}>
            <Grid size={{ xs: 12, sm: 12, md: showDemo ? 6 : 12 }}>
              <AppActions
                appUrl={appUrl}
                wallet={wallet}
                onConnectWallet={handleConnectWallet}
                chain={chain}
                app={backendApp || safeApp}
              />
            </Grid>
            {showDemo && (
              <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                <TryDemo
                  demoUrl={{
                    pathname: AppRoutes.apps.open,
                    query: { safe: SAFE_APPS_DEMO_SAFE_MAINNET, appUrl },
                  }}
                  onClick={handleDemoClick}
                />
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  )
}

export { SafeAppLanding }
