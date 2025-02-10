import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { Typography } from '@mui/material'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { BRAND_NAME } from '@/config/constants'

const LazyStakePage = dynamic(() => import('@/features/stake/components/StakePage'), { ssr: false })

const StakePage: NextPage = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.STAKING) || true

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Stake`}</title>
      </Head>

      {isFeatureEnabled === true ? (
        <LazyStakePage />
      ) : isFeatureEnabled === false ? (
        <main>
          <Typography textAlign="center" my={3}>
            Staking is not available on this network.
          </Typography>
        </main>
      ) : null}
    </>
  )
}

export default StakePage
