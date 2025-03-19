import type { NextPage } from 'next'
import Head from 'next/head'
import { Typography, Box } from '@mui/material'
import AssetsHeader from '@/components/balances/AssetsHeader'
import { BRAND_NAME } from '@/config/constants'

const DeFi: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – DeFi`}</title>
      </Head>

      <AssetsHeader />

      <main>
        <Box p={4}>
          <Typography variant="h4" mb={2}>
            DeFi Positions
          </Typography>
          <Typography color="text.secondary">
            No DeFi positions found. Your DeFi investments and staking positions will appear here.
          </Typography>
        </Box>
      </main>
    </>
  )
}

export default DeFi
