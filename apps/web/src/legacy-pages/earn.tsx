import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { Typography } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'

const LazyEarnPage = dynamic(() => import('@/features/earn'), { ssr: false })

const EarnPage: NextPage = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.EARN)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Earn`}</title>
      </Head>

      {isFeatureEnabled === true ? (
        <LazyEarnPage />
      ) : isFeatureEnabled === false ? (
        <main>
          <Typography textAlign="center" my={3}>
            Earn is not available on this network.
          </Typography>
        </main>
      ) : null}
    </>
  )
}

export default EarnPage
