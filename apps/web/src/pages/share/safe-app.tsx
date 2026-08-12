import Head from 'next/head'
import { Spinner } from '@/components/ui/spinner'
import { useSafeAppUrl } from '@/hooks/safe-apps/useSafeAppUrl'
import { SafeAppLanding } from '@/components/safe-apps/SafeAppLandingPage'
import { useCurrentChain } from '@/hooks/useChains'
import { BRAND_NAME } from '@/config/constants'

const ShareSafeApp = () => {
  const appUrl = useSafeAppUrl()
  const chain = useCurrentChain()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Safe Apps`}</title>
      </Head>

      <main>
        {appUrl && chain ? (
          <SafeAppLanding appUrl={appUrl} chain={chain} />
        ) : (
          <div className="py-8 text-center">
            <Spinner className="mx-auto size-10" />
          </div>
        )}
      </main>
    </>
  )
}

export default ShareSafeApp
