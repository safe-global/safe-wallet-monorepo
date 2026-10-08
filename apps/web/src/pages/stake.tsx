import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { StakeFeature } from '@/features/stake'
import { useLoadFeature } from '@/features/__core__'
import { StakePageView } from '@views/pages/StakePageView'

const StakePage: NextPage = () => {
  const stake = useLoadFeature(StakeFeature)
  const { StakePage: StakeFeaturePage } = stake

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Stake`}</title>
      </Head>

      <StakePageView isReady={stake.$isReady} isDisabled={stake.$isDisabled} stakePage={<StakeFeaturePage />} />
    </>
  )
}

export default StakePage
