import type { NextPage } from 'next'
import Head from 'next/head'

import SafeOverview from '@/features/safe-overview'
import { BRAND_NAME } from '@/config/constants'

const DashboardNew: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Overview`}</title>
      </Head>

      <main>
        <SafeOverview />
      </main>
    </>
  )
}

export default DashboardNew
