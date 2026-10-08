import type { NextPage } from 'next'
import Head from 'next/head'

import SingleMsg from '@/components/safe-messages/SingleMsg'
import { BRAND_NAME } from '@/config/constants'
import { MessageDetailsView } from '@views/pages/transactions/MessageDetailsView'

const SingleTransaction: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Message details`}</title>
      </Head>

      <MessageDetailsView>
        <SingleMsg />
      </MessageDetailsView>
    </>
  )
}

export default SingleTransaction
