import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsHeader from '@/components/balances/AssetsHeader'
import { BRAND_NAME } from '@/config/constants'
import { PageMainView } from '@views/pages/PageMainView'
import dynamic from 'next/dynamic'

const DefiPositions = dynamic(() => import('@/features/positions'))

const Positions: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader />

      <PageMainView>
        <DefiPositions />
      </PageMainView>
    </>
  )
}

export default Positions
