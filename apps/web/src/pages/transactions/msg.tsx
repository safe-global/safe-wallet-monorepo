import type { NextPage } from 'next'
import Head from 'next/head'

import { Typography } from '@/components/ui/typography'
import SingleMsg from '@/components/safe-messages/SingleMsg'
import { BRAND_NAME } from '@/config/constants'

const SingleTransaction: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Message details`}</title>
      </Head>

      <main>
        <Typography data-testid="tx-details" variant="h3" className="pt-2 mb-6">
          Message details
        </Typography>

        <SingleMsg />
      </main>
    </>
  )
}

export default SingleTransaction
