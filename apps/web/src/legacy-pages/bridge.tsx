import Head from 'next/head'
import type { NextPage } from 'next'

import { Bridge } from '@/features/bridge/components/Bridge'
import { BRAND_NAME } from '@/config/constants'

const BridgePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Bridge`}</title>
      </Head>
      <Bridge />
    </>
  )
}

export default BridgePage
