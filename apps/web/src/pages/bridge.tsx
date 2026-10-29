import Head from 'next/head'

import Bridge from '@/features/bridge'
import { BRAND_NAME } from '@/config/constants'

const BridgePage = () => {
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
