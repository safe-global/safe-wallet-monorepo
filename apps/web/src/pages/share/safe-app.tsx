import Head from 'next/head'
import { useSafeAppUrl } from '@/hooks/safe-apps/useSafeAppUrl'
import { SafeAppLanding } from '@/components/safe-apps/SafeAppLandingPage'
import { useCurrentChain } from '@/hooks/useChains'
import { BRAND_NAME } from '@/config/constants'
import { ShareSafeAppView } from '@views/pages/share/ShareSafeAppView'

const ShareSafeApp = () => {
  const appUrl = useSafeAppUrl()
  const chain = useCurrentChain()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Safe Apps`}</title>
      </Head>

      <ShareSafeAppView landing={appUrl && chain ? <SafeAppLanding appUrl={appUrl} chain={chain} /> : undefined} />
    </>
  )
}

export default ShareSafeApp
