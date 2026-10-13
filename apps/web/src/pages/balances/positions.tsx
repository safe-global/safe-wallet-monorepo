import Head from 'next/head'

import AssetsHeader from '@/components/balances/AssetsHeader'
import { BRAND_NAME } from '@/config/constants'
import dynamic from 'next/dynamic'

const DefiPositions = dynamic(() => import('@/features/positions'))

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
