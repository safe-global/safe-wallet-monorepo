import type { NextPage } from 'next'
import Head from 'next/head'

import SingleTx from '@/components/transactions/SingleTx'
import { BRAND_NAME } from '@/config/constants'
import { TransactionDetailsView } from '@views/pages/transactions/TransactionDetailsView'

const SingleTransaction: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Transaction details`}</title>
      </Head>

      <TransactionDetailsView>
        <SingleTx />
      </TransactionDetailsView>
    </>
  )
}

export default SingleTransaction
