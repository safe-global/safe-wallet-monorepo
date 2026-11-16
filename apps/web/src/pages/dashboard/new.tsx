import Head from 'next/head'

import SafeOverview from '@/features/safe-overview/public/SafeOverview'
import { BRAND_NAME } from '@/config/constants'

const DashboardNew = () => {
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
