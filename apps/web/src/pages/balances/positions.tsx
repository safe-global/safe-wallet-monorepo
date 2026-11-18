import Head from 'next/head'

import AssetsHeader from '@/components/balances/AssetsHeader'
import { BRAND_NAME } from '@/config/constants'
import DefiPositions from '@/features/positions/public/components/Positions'

const Positions = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader />

      <main>
        <DefiPositions />
      </main>
    </>
  )
}

export default Positions
