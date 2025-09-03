import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { Typography } from '@mui/material'
import { useHasFeature } from '@/hooks/useChains'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'

const LazyStakePage = dynamic(() => import('@/features/stake/components/StakePage'), { ssr: false })

const StakePage: NextPage = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.STAKING)

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
