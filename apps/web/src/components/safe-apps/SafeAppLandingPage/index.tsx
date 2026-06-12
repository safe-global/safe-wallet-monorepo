import { useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
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
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

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

  if (isLoading || backendAppLoading) {
    return (
      <div className="flex justify-center py-8 text-center">
        <Spinner className="size-10" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-8 lg:col-start-3 xl:col-span-6 xl:col-start-4">
        <Card className="p-12">
          <SafeAppDetails app={backendApp || safeApp} showDefaultListWarning={!backendApp} />
          <div className="mt-8 grid grid-cols-12 gap-4">
            <div className={showDemo ? 'col-span-12 md:col-span-6' : 'col-span-12'}>
              <AppActions
                appUrl={appUrl}
                wallet={wallet}
                onConnectWallet={handleConnectWallet}
                chain={chain}
                app={backendApp || safeApp}
              />
            </div>
            {showDemo && (
              <div className="col-span-12 md:col-span-6">
                <TryDemo
                  demoUrl={{
                    pathname: AppRoutes.apps.open,
                    query: { safe: SAFE_APPS_DEMO_SAFE_MAINNET, appUrl },
                  }}
                  onClick={handleDemoClick}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export { SafeAppLanding }
