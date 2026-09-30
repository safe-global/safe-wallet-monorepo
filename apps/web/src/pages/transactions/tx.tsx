import type { NextPage } from 'next'
import Head from 'next/head'

import SingleTx from '@/components/transactions/SingleTx'
import { Typography } from '@/components/ui/typography'
import { BRAND_NAME } from '@/config/constants'

const SingleTransaction: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transaction details`}</title>
      </Head>

      <main>
        <Typography data-testid="tx-details" variant="h3" className="pt-2 mb-6">
          Transaction details
        </Typography>

        <SingleTx />
      </main>
    </>
  )
}

export default SingleTransaction
