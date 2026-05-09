import type { NextPage } from 'next'
import Head from 'next/head'
import { Typography } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import { StakeFeature } from '@/features/stake'
import { useLoadFeature } from '@/features/__core__'

const StakePage: NextPage = () => {
  const stake = useLoadFeature(StakeFeature)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Stake`}</title>
      </Head>

      {stake.$isReady ? (
        <stake.StakePage />
      ) : stake.$isDisabled ? (
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
