import { useEffect } from 'react'
import { OVERVIEW_EVENTS, SAFE_APPS_EVENTS, trackEvent, trackSafeAppEvent } from '@/services/analytics'
import { useSafeAppFromBackend } from '@/hooks/safe-apps/useSafeAppFromBackend'
import { useSafeAppFromManifest } from '@/hooks/safe-apps/useSafeAppFromManifest'
import { SafeAppDetails } from '@/components/safe-apps/SafeAppLandingPage/SafeAppDetails'
import { AppActions } from '@/components/safe-apps/SafeAppLandingPage/AppActions'
import useWallet from '@/hooks/wallets/useWallet'
import { AppRoutes } from '@/config/routes'
import { SAFE_APPS_DEMO_SAFE_MAINNET } from '@/config/constants'
import useOnboard from '@/hooks/wallets/useOnboard'
import { Errors, logError } from '@/services/exceptions'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { SafeAppLandingPageView } from '@views/components/safe-apps/SafeAppLandingPage/SafeAppLandingPageView'

type Props = {
  appUrl: string
  chain: Chain
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

  return (
    <SafeAppLandingPageView
      isLoading={isLoading || backendAppLoading}
      details={<SafeAppDetails app={backendApp || safeApp} showDefaultListWarning={!backendApp} />}
      appActions={
        <AppActions
          appUrl={appUrl}
          wallet={wallet}
          onConnectWallet={handleConnectWallet}
          chain={chain}
          app={backendApp || safeApp}
        />
      }
      showDemo={showDemo}
      demoUrl={{
        pathname: AppRoutes.apps.open,
        // eslint-disable-next-line no-restricted-syntax -- The demo Safe is in no Workspace
        query: { safe: SAFE_APPS_DEMO_SAFE_MAINNET, appUrl },
      }}
      onDemoClick={handleDemoClick}
    />
  )
}

export { SafeAppLanding }
