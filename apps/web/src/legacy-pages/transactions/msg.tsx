import type { NextPage } from 'next'
import Head from 'next/head'

import Typography from '@mui/material/Typography'
import SingleMsg from '@/components/safe-messages/SingleMsg'
import { BRAND_NAME } from '@/config/constants'

const SingleTransaction: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Message details`}</title>
      </Head>

      <main>
        <Typography data-testid="tx-details" variant="h3" fontWeight={700} pt={1} mb={3}>
          Message details
        </Typography>

        <SingleMsg />
      </main>
    </>
  )
}

export default SingleTransaction
