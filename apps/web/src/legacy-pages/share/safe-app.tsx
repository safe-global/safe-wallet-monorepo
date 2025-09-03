import Head from 'next/head'
import { Box, CircularProgress } from '@mui/material'
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
          <Box py={4} textAlign="center">
            <CircularProgress size={40} />
          </Box>
        )}
      </main>
    </>
  )
}

export default ShareSafeApp
