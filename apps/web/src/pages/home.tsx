import type { NextPage } from 'next'
import Head from 'next/head'

import Dashboard from '@/components/dashboard'
import { BRAND_NAME } from '@/config/constants'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Dashboard`}</title>
      </Head>

      <main>
        <Dashboard />
      </main>
    </>
  )
}

export default Home
