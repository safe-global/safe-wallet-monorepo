import type { NextPage } from 'next'
import Head from 'next/head'

import SafeOverview from '@/features/safe-overview'
import { BRAND_NAME } from '@/config/constants'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Dashboard`}</title>
      </Head>

      <main>
        <SafeOverview />
      </main>
    </>
  )
}

export default Home
