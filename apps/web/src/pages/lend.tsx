import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { Typography } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'

const LazyLendPage = dynamic(() => import('@/features/lend'), { ssr: false })

const LendPage: NextPage = () => {
  const isFeatureEnabled = true // TODO: Base is not available on staging so can't add a feature flag yet. Add one for prod.

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Lend`}</title>
      </Head>

      {isFeatureEnabled === true ? (
        <LazyLendPage />
      ) : isFeatureEnabled === false ? (
        <main>
          <Typography textAlign="center" my={3}>
            Lending is not available on this network.
          </Typography>
        </main>
      ) : null}
    </>
  )
}

export default LendPage
