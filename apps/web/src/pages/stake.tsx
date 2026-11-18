import Head from 'next/head'
import { Typography } from '@safe-global/views/components/ui/typography'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import StakeContent from '@/features/stake/public/components/StakePage'

const StakePage = () => {
  const isStakingEnabled = useHasFeature(FEATURES.STAKING)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Stake`}</title>
      </Head>

      {isStakingEnabled ? (
        <StakeContent />
      ) : isStakingEnabled === false ? (
        <main>
          <Typography align="center" className="my-6">
            Staking is not available on this network.
          </Typography>
        </main>
      ) : null}
    </>
  )
}

export default StakePage
