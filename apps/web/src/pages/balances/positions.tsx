import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsHeader from '@/components/balances/AssetsHeader'
import { BRAND_NAME } from '@/config/constants'
import DefiPositions from '@/features/positions'
import { Box } from '@mui/material'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import usePositionsFiatTotal from '@/features/positions/hooks/usePositionsFiatTotal'

const Positions: NextPage = () => {
  const fiatTotal = usePositionsFiatTotal()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader />

      <main>
        <Box mb={2}>
          <TotalAssetValue fiatTotal={fiatTotal} />
        </Box>
        <DefiPositions />
      </main>
    </>
  )
}

export default Positions
